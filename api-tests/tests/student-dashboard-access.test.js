const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Student Dashboard API (/api/v1/student/*)', () => {
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };

    let studentToken;
    let teacherToken;
    let adminToken;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;
    });

    afterAll(() => {
        setAuthToken(null);
    });

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
