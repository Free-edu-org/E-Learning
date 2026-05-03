const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Teacher Lesson Stats API (GET /api/v1/teacher/lessons/{lessonPublicId}/stats)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken, teacherToken, studentToken;
    let isolatedGroupId, isolatedLessonPublicId;
    let isolatedStudentPublicId, isolatedStudentToken;
    let chooseTaskPublicId;

    // ─── Setup: isolated lesson with one student who completes it ──────
    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        // Teacher creates group + lesson + task
        setAuthToken(teacherToken);

        res = await apiClient.post('/user-groups', {
            name: `Stats Group ${uniqueId}`,
            description: 'Group for lesson stats test'
        });
        expect(res.status).toBe(201);
        isolatedGroupId = res.data.publicId;

        res = await apiClient.post('/lessons', {
            title: `Stats ${uniqueId}`,
            theme: 'Lesson Stats Testing',
            groupPublicIds: [isolatedGroupId]
        });
        expect(res.status).toBe(201);
        isolatedLessonPublicId = res.data.publicId;
        expect(res.data).not.toHaveProperty('id');

        res = await apiClient.post(`/lessons/${isolatedLessonPublicId}/tasks/choose`, {
            task: 'What is 1+1?',
            possibleAnswers: '1|2|3|4',
            correctAnswer: 1,
            hint: 'Basic math',
            section: 'Math'
        });
        expect(res.status).toBe(201);
        chooseTaskPublicId = res.data.publicId;

        res = await apiClient.patch(`/lessons/${isolatedLessonPublicId}/status`, { isActive: true });
        expect(res.status).toBe(204);

        // Admin creates isolated student
        setAuthToken(adminToken);
        const studentData = {
            email: `stats.student.${uniqueId}@test.com`,
            username: `stats_student_${uniqueId}`,
            password: 'password123'
        };
        res = await apiClient.post('/users/register', studentData);
        expect(res.status).toBe(201);

        res = await apiClient.post('/auth/login', {
            identifier: studentData.username,
            password: studentData.password
        });
        isolatedStudentToken = res.data.token;

        setAuthToken(isolatedStudentToken);
        res = await apiClient.get('/users/me');
        isolatedStudentPublicId = res.data.publicId;

        // Add student to group
        setAuthToken(adminToken);
        res = await apiClient.post(`/user-groups/${isolatedGroupId}/members/${isolatedStudentPublicId}`);
        expect(res.status).toBe(204);

        // Student starts and submits the lesson
        setAuthToken(isolatedStudentToken);
        res = await apiClient.get(`/lessons/${isolatedLessonPublicId}/tasks`);
        expect(res.status).toBe(200);
        expect(res.data.lessonPublicId).toBe(isolatedLessonPublicId);
        expect(res.data).not.toHaveProperty('lessonId');

        res = await apiClient.post(`/lessons/${isolatedLessonPublicId}/submit`, {
            answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
        });
        expect(res.status).toBe(200);
    });

    // ─── Cleanup ─────────────────────────────────────────────────────
    afterAll(async () => {
        setAuthToken(teacherToken);
        if (isolatedLessonPublicId && isolatedStudentPublicId) {
            await apiClient.post(`/lessons/${isolatedLessonPublicId}/users/${isolatedStudentPublicId}/reset`);
        }
        if (chooseTaskPublicId) {
            await apiClient.delete(`/lessons/${isolatedLessonPublicId}/tasks/choose/${chooseTaskPublicId}`);
        }
        if (isolatedLessonPublicId) {
            const r = await apiClient.delete(`/lessons/${isolatedLessonPublicId}`);
            expect([204, 404]).toContain(r.status);
        }

        setAuthToken(adminToken);
        if (isolatedGroupId) {
            const r = await apiClient.delete(`/user-groups/${isolatedGroupId}`);
            expect([204, 404]).toContain(r.status);
        }
        if (isolatedStudentPublicId) {
            const r = await apiClient.delete(`/users/${isolatedStudentPublicId}`);
            expect([204, 404]).toContain(r.status);
        }

        setAuthToken(null);
    });

    // ─── Security ────────────────────────────────────────────────────
    describe('Security', () => {
        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonPublicId}/stats`);
            expect(response.status).toBe(401);
        });

        it('should return 403 for STUDENT role', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonPublicId}/stats`);
            expect(response.status).toBe(403);
        });

        it('should return 403 for ADMIN role', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonPublicId}/stats`);
            expect(response.status).toBe(403);
        });

        it('should return 403 for a different TEACHER who does not own the lesson', async () => {
            // Create a second teacher who doesn't own isolatedLessonPublicId
            setAuthToken(adminToken);
            const otherTeacherData = {
                email: `other.teacher.stats.${Date.now()}@test.com`,
                username: `other_teacher_stats_${Date.now()}`,
                password: 'password123'
            };
            let res = await apiClient.post('/users/teacher', otherTeacherData);
            expect(res.status).toBe(201);

            res = await apiClient.post('/auth/login', {
                identifier: otherTeacherData.username,
                password: otherTeacherData.password
            });
            const otherTeacherToken = res.data.token;
            const otherTeacherPublicId = (await (async () => {
                setAuthToken(otherTeacherToken);
                const r = await apiClient.get('/users/me');
                return r.data;
            })()).publicId;

            try {
                setAuthToken(otherTeacherToken);
                const response = await apiClient.get(`/teacher/lessons/${isolatedLessonPublicId}/stats`);
                expect(response.status).toBe(403);
            } finally {
                setAuthToken(adminToken);
                await apiClient.delete(`/users/${otherTeacherPublicId}`);
            }
        });
    });

    // ─── Response structure ───────────────────────────────────────────
    describe('Response structure', () => {
        let stats;

        beforeAll(async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonPublicId}/stats`);
            expect(response.status).toBe(200);
            stats = response.data;
        });

        it('should return 200 for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonPublicId}/stats`);
            expect(response.status).toBe(200);
        });

        it('should have avgScore field (number)', () => {
            expect(stats).toHaveProperty('avgScore');
            expect(typeof stats.avgScore).toBe('number');
        });

        it('should have studentsCompleted field (number)', () => {
            expect(stats).toHaveProperty('studentsCompleted');
            expect(typeof stats.studentsCompleted).toBe('number');
        });

        it('should have bestScore field (number)', () => {
            expect(stats).toHaveProperty('bestScore');
            expect(typeof stats.bestScore).toBe('number');
        });

        it('should have studentResults array', () => {
            expect(stats).toHaveProperty('studentResults');
            expect(Array.isArray(stats.studentResults)).toBe(true);
        });

        it('each studentResult should have required fields', () => {
            expect(stats.studentResults.length).toBeGreaterThanOrEqual(1);
            const result = stats.studentResults[0];
            expect(result).toHaveProperty('userPublicId');
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('completedAt');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('maxScore');
            expect(result).toHaveProperty('resultPercent');
        });
    });

    // ─── Data invariants ─────────────────────────────────────────────
    describe('Data invariants', () => {
        let stats;

        beforeAll(async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonPublicId}/stats`);
            stats = response.data;
        });

        it('avgScore should be between 0 and 100', () => {
            expect(stats.avgScore).toBeGreaterThanOrEqual(0);
            expect(stats.avgScore).toBeLessThanOrEqual(100);
        });

        it('bestScore should be >= avgScore', () => {
            expect(stats.bestScore).toBeGreaterThanOrEqual(stats.avgScore);
        });

        it('studentsCompleted should equal studentResults.length', () => {
            expect(stats.studentsCompleted).toBe(stats.studentResults.length);
        });

        it('resultPercent should be between 0 and 100 for each student', () => {
            stats.studentResults.forEach((r) => {
                expect(r.resultPercent).toBeGreaterThanOrEqual(0);
                expect(r.resultPercent).toBeLessThanOrEqual(100);
            });
        });

        it('score should be <= maxScore for each student', () => {
            stats.studentResults.forEach((r) => {
                expect(r.score).toBeLessThanOrEqual(r.maxScore);
            });
        });

        it('should count the isolated student who completed the lesson', () => {
            expect(stats.studentsCompleted).toBeGreaterThanOrEqual(1);
            const found = stats.studentResults.find((r) => r.userPublicId === isolatedStudentPublicId);
            expect(found).toBeDefined();
        });

        it('isolated student should have correct score (1/1 = 100%)', () => {
            const found = stats.studentResults.find((r) => r.userPublicId === isolatedStudentPublicId);
            expect(found.score).toBe(1);
            expect(found.maxScore).toBe(1);
            expect(found.resultPercent).toBe(100);
        });

        it('bestScore should be 100 when at least one student scored perfectly', () => {
            expect(stats.bestScore).toBe(100);
        });

        it('studentResults should be sorted descending by resultPercent', () => {
            const percents = stats.studentResults.map((r) => r.resultPercent);
            for (let i = 1; i < percents.length; i++) {
                expect(percents[i]).toBeLessThanOrEqual(percents[i - 1]);
            }
        });
    });

    // ─── Empty lesson (no submissions) ───────────────────────────────
    describe('Lesson with no student submissions', () => {
        let emptyLessonPublicId;

        beforeAll(async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post('/lessons', {
                title: `Empty Stats ${uniqueId}`,
                theme: 'No submissions',
                groupPublicIds: [isolatedGroupId]
            });
            expect(res.status).toBe(201);
            emptyLessonPublicId = res.data.publicId;
            expect(res.data).not.toHaveProperty('id');
        });

        afterAll(async () => {
            setAuthToken(teacherToken);
            if (emptyLessonPublicId) {
                const r = await apiClient.delete(`/lessons/${emptyLessonPublicId}`);
                expect([204, 404]).toContain(r.status);
            }
        });

        it('should return 200 with empty studentResults', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/teacher/lessons/${emptyLessonPublicId}/stats`);
            expect(response.status).toBe(200);
            expect(response.data.studentResults).toHaveLength(0);
            expect(response.data.studentsCompleted).toBe(0);
            expect(response.data.avgScore).toBe(0);
        });
    });
});
