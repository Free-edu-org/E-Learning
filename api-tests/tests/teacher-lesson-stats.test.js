const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Teacher Lesson Stats API (GET /api/v1/teacher/lessons/{lessonId}/stats)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken, teacherToken, studentToken;
    let isolatedGroupId, isolatedLessonId;
    let isolatedStudentId, isolatedStudentToken;
    let chooseTaskId;

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
        isolatedGroupId = res.data.id;

        res = await apiClient.post('/lessons', {
            title: `Stats Lesson ${uniqueId}`,
            theme: 'Lesson Stats Testing',
            groupIds: [isolatedGroupId]
        });
        expect(res.status).toBe(201);
        isolatedLessonId = res.data.id;

        res = await apiClient.patch(`/lessons/${isolatedLessonId}/status`, { isActive: true });
        expect(res.status).toBe(204);

        res = await apiClient.post(`/lessons/${isolatedLessonId}/tasks/choose`, {
            task: 'What is 1+1?',
            possibleAnswers: '1|2|3|4',
            correctAnswer: 1,
            hint: 'Basic math',
            section: 'Math'
        });
        expect(res.status).toBe(201);
        chooseTaskId = res.data.id;

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
        isolatedStudentId = res.data.id;

        // Add student to group
        setAuthToken(adminToken);
        res = await apiClient.post(`/user-groups/${isolatedGroupId}/members/${isolatedStudentId}`);
        expect(res.status).toBe(204);

        // Student starts and submits the lesson
        setAuthToken(isolatedStudentToken);
        res = await apiClient.get(`/lessons/${isolatedLessonId}/tasks`);
        expect(res.status).toBe(200);

        res = await apiClient.post(`/lessons/${isolatedLessonId}/submit`, {
            answers: [{ taskId: chooseTaskId, taskType: 'choose', answer: '1' }]
        });
        expect(res.status).toBe(200);
    });

    // ─── Cleanup ─────────────────────────────────────────────────────
    afterAll(async () => {
        setAuthToken(teacherToken);
        if (isolatedLessonId && isolatedStudentId) {
            await apiClient.post(`/lessons/${isolatedLessonId}/users/${isolatedStudentId}/reset`);
        }
        if (chooseTaskId) {
            await apiClient.delete(`/lessons/${isolatedLessonId}/tasks/choose/${chooseTaskId}`);
        }
        if (isolatedLessonId) {
            const r = await apiClient.delete(`/lessons/${isolatedLessonId}`);
            expect([204, 404]).toContain(r.status);
        }

        setAuthToken(adminToken);
        if (isolatedGroupId) {
            const r = await apiClient.delete(`/user-groups/${isolatedGroupId}`);
            expect([204, 404]).toContain(r.status);
        }
        if (isolatedStudentId) {
            const r = await apiClient.delete(`/users/${isolatedStudentId}`);
            expect([204, 404]).toContain(r.status);
        }

        setAuthToken(null);
    });

    // ─── Security ────────────────────────────────────────────────────
    describe('Security', () => {
        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonId}/stats`);
            expect(response.status).toBe(401);
        });

        it('should return 403 for STUDENT role', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonId}/stats`);
            expect(response.status).toBe(403);
        });

        it('should return 403 for ADMIN role', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonId}/stats`);
            expect(response.status).toBe(403);
        });

        it('should return 403 for a different TEACHER who does not own the lesson', async () => {
            // Create a second teacher who doesn't own isolatedLessonId
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
            const otherTeacherId = (await (async () => {
                setAuthToken(otherTeacherToken);
                const r = await apiClient.get('/users/me');
                return r.data;
            })()).id;

            try {
                setAuthToken(otherTeacherToken);
                const response = await apiClient.get(`/teacher/lessons/${isolatedLessonId}/stats`);
                expect(response.status).toBe(403);
            } finally {
                setAuthToken(adminToken);
                await apiClient.delete(`/users/${otherTeacherId}`);
            }
        });
    });

    // ─── Response structure ───────────────────────────────────────────
    describe('Response structure', () => {
        let stats;

        beforeAll(async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonId}/stats`);
            expect(response.status).toBe(200);
            stats = response.data;
        });

        it('should return 200 for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonId}/stats`);
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
            expect(result).toHaveProperty('userId');
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
            const response = await apiClient.get(`/teacher/lessons/${isolatedLessonId}/stats`);
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
            const found = stats.studentResults.find((r) => r.userId === isolatedStudentId);
            expect(found).toBeDefined();
        });

        it('isolated student should have correct score (1/1 = 100%)', () => {
            const found = stats.studentResults.find((r) => r.userId === isolatedStudentId);
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
        let emptyLessonId;

        beforeAll(async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post('/lessons', {
                title: `Empty Stats Lesson ${uniqueId}`,
                theme: 'No submissions',
                groupIds: [isolatedGroupId]
            });
            expect(res.status).toBe(201);
            emptyLessonId = res.data.id;
        });

        afterAll(async () => {
            setAuthToken(teacherToken);
            if (emptyLessonId) {
                const r = await apiClient.delete(`/lessons/${emptyLessonId}`);
                expect([204, 404]).toContain(r.status);
            }
        });

        it('should return 200 with empty studentResults', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/teacher/lessons/${emptyLessonId}/stats`);
            expect(response.status).toBe(200);
            expect(response.data.studentResults).toHaveLength(0);
            expect(response.data.studentsCompleted).toBe(0);
            expect(response.data.avgScore).toBe(0);
        });
    });
});
