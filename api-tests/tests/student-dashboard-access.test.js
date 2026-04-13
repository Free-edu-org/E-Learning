const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Student Dashboard API (/api/v1/student/*)', () => {
    const uniqueId = Date.now();
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };

    let studentToken;
    let teacherToken;
    let adminToken;
    let isolatedStudentToken;
    let isolatedStudentId;
    let isolatedGroupId;
    let otherGroupId;
    let sharedLessonId;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;
    });

    afterAll(async () => {
        setAuthToken(teacherToken);
        if (sharedLessonId) {
            const response = await apiClient.delete(`/lessons/${sharedLessonId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(adminToken);
        for (const groupId of [isolatedGroupId, otherGroupId]) {
            if (groupId) {
                const response = await apiClient.delete(`/user-groups/${groupId}`);
                expect([204, 404]).toContain(response.status);
            }
        }
        if (isolatedStudentId) {
            const response = await apiClient.delete(`/users/${isolatedStudentId}`);
            expect([204, 404]).toContain(response.status);
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
            title: `Shared Student Dashboard Lesson ${uniqueId}`,
            theme: 'Student Dashboard Regression',
            groupIds: [isolatedGroupId, otherGroupId]
        });
        expect(res.status).toBe(201);
        sharedLessonId = res.data.id;

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
                expect(lesson).toHaveProperty('id');
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
            const lesson = response.data.find((item) => item.id === sharedLessonId);
            expect(lesson).toBeDefined();
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
});
