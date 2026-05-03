const FormData = require('form-data');
const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Student Dashboard API (/api/v1/student/*)', () => {
    const uniqueId = Date.now();
    const studentCreds = {identifier: 'jan_kowalski', password: 'student1'};
    const teacherCreds = {identifier: 'pan_tomasz', password: 'admin1'};
    const adminCreds = {identifier: 'admin_marek', password: 'admin1'};

    let studentToken;
    let teacherToken;
    let adminToken;
    let isolatedStudentToken;
    let isolatedStudentId;
    let isolatedGroupId;
    let otherGroupId;
    let sharedLessonPublicId;
    let sharedLessonTaskId;

    // Attachment test resources
    let attachmentLessonPublicId;
    let attachmentGroupId;
    let attachmentLessonTaskId;
    let attachmentStudentToken;
    let attachmentStudentId;
    let attachmentId;
    let noAccessStudentToken;
    let noAccessStudentId;

    const VALID_PDF = Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
        '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n' +
        'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n' +
        '0000000058 00000 n\n0000000115 00000 n\n' +
        'trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n'
    );

    const makePdfForm = () => {
        const form = new FormData();
        form.append('file', VALID_PDF, {filename: 'test.pdf', contentType: 'application/pdf'});
        return form;
    };

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        // --- Setup resources for attachment tests ---
        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `Attach Student Group ${uniqueId}`,
            description: 'Group for student attachment tests',
        });
        expect(res.status).toBe(201);
        attachmentGroupId = res.data.id;

        res = await apiClient.post('/lessons', {
            title: `Attach Lesson ${uniqueId}`,
            theme: 'Attachment Tests',
            groupIds: [attachmentGroupId],
        });
        expect(res.status).toBe(201);
        attachmentLessonPublicId = res.data.publicId;
        expect(res.data).not.toHaveProperty('id');

        setAuthToken(teacherToken);
        res = await apiClient.post(`/lessons/${attachmentLessonPublicId}/tasks/choose`, {
            task: 'Attachment setup task',
            possibleAnswers: 'skip|ok',
            correctAnswer: 1
        });
        expect(res.status).toBe(201);
        attachmentLessonTaskId = res.data.id;

        // Activate the lesson
        setAuthToken(adminToken);
        res = await apiClient.patch(`/lessons/${attachmentLessonPublicId}/status`, {isActive: true});
        expect(res.status).toBe(204);

        // Upload attachment as teacher
        setAuthToken(teacherToken);
        const form = makePdfForm();
        res = await apiClient.post(
            `/lessons/${attachmentLessonPublicId}/attachments`,
            form,
            {headers: form.getHeaders()}
        );
        expect(res.status).toBe(201);
        attachmentId = res.data.id;

        // Create student WITH access to the lesson's group
        setAuthToken(adminToken);
        res = await apiClient.post('/users/register', {
            email: `attach.student.${uniqueId}@test.com`,
            username: `attach_student_${uniqueId}`,
            password: 'password123',
        });
        expect(res.status).toBe(201);

        res = await apiClient.post('/auth/login', {
            identifier: `attach_student_${uniqueId}`,
            password: 'password123',
        });
        expect(res.status).toBe(200);
        attachmentStudentToken = res.data.token;

        setAuthToken(attachmentStudentToken);
        res = await apiClient.get('/users/me');
        attachmentStudentId = res.data.id;

        setAuthToken(adminToken);
        res = await apiClient.post(`/user-groups/${attachmentGroupId}/members/${attachmentStudentId}`);
        expect(res.status).toBe(204);

        // Create student WITHOUT access (no group assignment)
        res = await apiClient.post('/users/register', {
            email: `noaccess.student.${uniqueId}@test.com`,
            username: `noaccess_student_${uniqueId}`,
            password: 'password123',
        });
        expect(res.status).toBe(201);

        res = await apiClient.post('/auth/login', {
            identifier: `noaccess_student_${uniqueId}`,
            password: 'password123',
        });
        expect(res.status).toBe(200);
        noAccessStudentToken = res.data.token;

        setAuthToken(noAccessStudentToken);
        res = await apiClient.get('/users/me');
        noAccessStudentId = res.data.id;
    });

    afterAll(async () => {
        setAuthToken(teacherToken);
        for (const [lessonPublicId, taskId] of [
            [sharedLessonPublicId, sharedLessonTaskId],
            [attachmentLessonPublicId, attachmentLessonTaskId]
        ]) {
            if (lessonPublicId && taskId) {
                const response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/choose/${taskId}`);
                expect([204, 404]).toContain(response.status);
            }
        }

        if (attachmentLessonPublicId && attachmentId) {
            const response = await apiClient.delete(`/lessons/${attachmentLessonPublicId}/attachments/${attachmentId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(teacherToken);
        if (sharedLessonPublicId) {
            const response = await apiClient.delete(`/lessons/${sharedLessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }
        if (attachmentLessonPublicId) {
            const response = await apiClient.delete(`/lessons/${attachmentLessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(adminToken);
        for (const groupId of [isolatedGroupId, otherGroupId, attachmentGroupId]) {
            if (groupId) {
                const response = await apiClient.delete(`/user-groups/${groupId}`);
                expect([204, 404]).toContain(response.status);
            }
        }
        for (const userId of [isolatedStudentId, attachmentStudentId, noAccessStudentId]) {
            if (userId) {
                const response = await apiClient.delete(`/users/${userId}`);
                expect([204, 404]).toContain(response.status);
            }
        }

        setAuthToken(null);
    });

    async function setupSharedLessonForGroupLeakTest() {
        if (isolatedStudentToken) return;

        setAuthToken(teacherToken);
        let res = await apiClient.post('/user-groups', {
            name: `Student Dashboard Own Group ${uniqueId}`,
            description: 'Own group for student dashboard regression test'
        });
        expect(res.status).toBe(201);
        isolatedGroupId = res.data.id;

        res = await apiClient.post('/user-groups', {
            name: `Student Dashboard Other Group ${uniqueId}`,
            description: 'Other group for student dashboard regression test'
        });
        expect(res.status).toBe(201);
        otherGroupId = res.data.id;

        res = await apiClient.post('/lessons', {
            title: `Shared Lesson ${uniqueId}`,
            theme: 'Student Dashboard Regression',
            groupIds: [isolatedGroupId, otherGroupId]
        });
        expect(res.status).toBe(201);
        sharedLessonPublicId = res.data.publicId;
        expect(res.data).not.toHaveProperty('id');

        setAuthToken(teacherToken);
        res = await apiClient.post(`/lessons/${sharedLessonPublicId}/tasks/choose`, {
            task: 'Shared lesson setup task',
            possibleAnswers: 'a|b',
            correctAnswer: 0
        });
        expect(res.status).toBe(201);
        sharedLessonTaskId = res.data.id;

        res = await apiClient.patch(`/lessons/${sharedLessonPublicId}/status`, {isActive: true});
        expect(res.status).toBe(204);

        setAuthToken(adminToken);
        const studentData = {
            email: `student.dashboard.${uniqueId}@test.com`,
            username: `student_dashboard_${uniqueId}`,
            password: 'password123'
        };
        res = await apiClient.post('/users/register', studentData);
        expect(res.status).toBe(201);

        res = await apiClient.post('/auth/login', {
            identifier: studentData.username,
            password: studentData.password
        });
        expect(res.status).toBe(200);
        isolatedStudentToken = res.data.token;

        setAuthToken(isolatedStudentToken);
        res = await apiClient.get('/users/me');
        expect(res.status).toBe(200);
        isolatedStudentId = res.data.id;

        setAuthToken(adminToken);
        res = await apiClient.post(`/user-groups/${isolatedGroupId}/members/${isolatedStudentId}`);
        expect(res.status).toBe(204);
    }

    describe('GET /student/stats', () => {
        it('should allow STUDENT (200)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/student/stats');
            expect(response.status).toBe(200);
        });

        it('should return expected stats fields', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/student/stats');

            expect(response.data).toHaveProperty('totalLessons');
            expect(response.data).toHaveProperty('completedLessons');
            expect(response.data).toHaveProperty('inProgressLessons');
            expect(response.data).toHaveProperty('averageScore');
            expect(typeof response.data.totalLessons).toBe('number');
            expect(typeof response.data.completedLessons).toBe('number');
            expect(typeof response.data.inProgressLessons).toBe('number');
            expect(typeof response.data.averageScore).toBe('number');
            expect(response.data.completedLessons).toBeLessThanOrEqual(response.data.totalLessons);
            expect(response.data.inProgressLessons).toBeLessThanOrEqual(response.data.totalLessons);
            expect(response.data.averageScore).toBeGreaterThanOrEqual(0);
            expect(response.data.averageScore).toBeLessThanOrEqual(100);
        });

        it('should deny TEACHER (403)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/student/stats');
            expect(response.status).toBe(403);
        });

        it('should deny ADMIN (403)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/student/stats');
            expect(response.status).toBe(403);
        });

        it('should deny unauthenticated (401)', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/student/stats');
            expect(response.status).toBe(401);
        });
    });

    describe('GET /student/lessons', () => {
        it('should allow STUDENT and return lesson list', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/student/lessons');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThanOrEqual(1);
        });

        it('should return lesson progress fields', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/student/lessons');

            response.data.forEach((lesson) => {
                expect(lesson).toHaveProperty('publicId');
                expect(lesson).not.toHaveProperty('id');
                expect(lesson).toHaveProperty('title');
                expect(lesson).toHaveProperty('theme');
                expect(lesson).toHaveProperty('teacherId');
                expect(lesson).toHaveProperty('teacherName');
                expect(lesson).toHaveProperty('groups');
                expect(lesson).toHaveProperty('status');
                expect(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).toContain(lesson.status);
                expect(Array.isArray(lesson.groups)).toBe(true);
                lesson.groups.forEach((group) => {
                    expect(group).toHaveProperty('id');
                    expect(group).toHaveProperty('name');
                });
            });
        });

        it('should expose only the current student group for lessons assigned to multiple groups', async () => {
            await setupSharedLessonForGroupLeakTest();

            setAuthToken(isolatedStudentToken);
            const response = await apiClient.get('/student/lessons');

            expect(response.status).toBe(200);
            const lesson = response.data.find((item) => item.publicId === sharedLessonPublicId);
            expect(lesson).toBeDefined();
            expect(lesson).not.toHaveProperty('id');
            expect(lesson.groups).toHaveLength(1);
            expect(lesson.groups[0].id).toBe(isolatedGroupId);
            expect(lesson.groups.map((group) => group.id)).not.toContain(otherGroupId);
        });

        it('should deny TEACHER (403)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/student/lessons');
            expect(response.status).toBe(403);
        });

        it('should deny ADMIN (403)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/student/lessons');
            expect(response.status).toBe(403);
        });

        it('should deny unauthenticated (401)', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/student/lessons');
            expect(response.status).toBe(401);
        });
    });

    describe('GET /student/progress', () => {
        it('should allow STUDENT (200)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/student/progress');
            expect(response.status).toBe(200);
        });

        it('should return structured progress summary', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/student/progress');

            expect(response.data).toHaveProperty('summary');
            expect(response.data).toHaveProperty('completedLessons');
            expect(response.data).toHaveProperty('totalLessons');
            expect(response.data).toHaveProperty('inProgressLessons');
            expect(response.data).toHaveProperty('averageScore');
            expect(typeof response.data.summary).toBe('string');
            expect(response.data.summary.length).toBeGreaterThan(0);
        });

        it('should deny TEACHER (403)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/student/progress');
            expect(response.status).toBe(403);
        });

        it('should deny ADMIN (403)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/student/progress');
            expect(response.status).toBe(403);
        });

        it('should deny unauthenticated (401)', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/student/progress');
            expect(response.status).toBe(401);
        });
    });

    describe('GET /student/lessons — attachments field', () => {
        it('should include attachments array in each lesson', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/student/lessons');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            response.data.forEach((lesson) => {
                expect(lesson).toHaveProperty('attachments');
                expect(Array.isArray(lesson.attachments)).toBe(true);
                lesson.attachments.forEach((att) => {
                    expect(att).toHaveProperty('id');
                    expect(att).toHaveProperty('originalFileName');
                    expect(att).toHaveProperty('contentType');
                    expect(att).toHaveProperty('fileSize');
                    expect(att).toHaveProperty('createdAt');
                    expect(typeof att.id).toBe('number');
                    expect(typeof att.originalFileName).toBe('string');
                    expect(typeof att.fileSize).toBe('number');
                });
            });
        });

        it('student with access should see attachment on lesson with attachment', async () => {
            setAuthToken(attachmentStudentToken);
            const response = await apiClient.get('/student/lessons');
            expect(response.status).toBe(200);
            const lesson = response.data.find((l) => l.publicId === attachmentLessonPublicId);
            expect(lesson).toBeDefined();
            expect(lesson).not.toHaveProperty('id');
            expect(lesson.attachments.length).toBeGreaterThan(0);
            const att = lesson.attachments.find((a) => a.id === attachmentId);
            expect(att).toBeDefined();
            expect(att.originalFileName).toBe('test.pdf');
            expect(att.contentType).toBe('application/pdf');
        });

        it('student without access should not see lesson in their list', async () => {
            setAuthToken(noAccessStudentToken);
            const response = await apiClient.get('/student/lessons');
            expect(response.status).toBe(200);
            const lesson = response.data.find((l) => l.publicId === attachmentLessonPublicId);
            expect(lesson).toBeUndefined();
        });
    });

    describe('GET /lessons/{lessonPublicId}/attachments/{attachmentId} — student download access', () => {
        it('student with lesson access should download attachment (200)', async () => {
            setAuthToken(attachmentStudentToken);
            const response = await apiClient.get(
                `/lessons/${attachmentLessonPublicId}/attachments/${attachmentId}`,
                {responseType: 'arraybuffer'}
            );
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('application/pdf');
            expect(response.headers['content-disposition']).toContain('attachment');
        });

        it('student without lesson access should be denied (403)', async () => {
            setAuthToken(noAccessStudentToken);
            const response = await apiClient.get(
                `/lessons/${attachmentLessonPublicId}/attachments/${attachmentId}`
            );
            expect(response.status).toBe(403);
        });

        it('unauthenticated user should be denied (401)', async () => {
            setAuthToken(null);
            const response = await apiClient.get(
                `/lessons/${attachmentLessonPublicId}/attachments/${attachmentId}`
            );
            expect(response.status).toBe(401);
        });
    });
});
