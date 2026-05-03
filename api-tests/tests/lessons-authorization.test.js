const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Lessons API Authorization (/api/v1/lessons)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let secondTeacherToken;
    let secondTeacherPublicId;
    let ownLessonPublicId;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        const secondTeacher = {
            email: `lesson.teacher.${uniqueId}@example.com`,
            username: `lesson_teacher_${uniqueId}`,
            password: 'password123'
        };
        setAuthToken(adminToken);
        await apiClient.post('/users/teacher', secondTeacher);
        res = await apiClient.post('/auth/login', {
            identifier: secondTeacher.username,
            password: secondTeacher.password
        });
        secondTeacherToken = res.data.token;

        setAuthToken(secondTeacherToken);
        res = await apiClient.get('/users/me');
        secondTeacherPublicId = res.data.publicId;
        expect(res.data).not.toHaveProperty('id');

        setAuthToken(teacherToken);
        res = await apiClient.post('/lessons', {
            title: `Own Lesson ${uniqueId}`,
            theme: 'Grammar',
            groupPublicIds: []
        });
        ownLessonPublicId = res.data.publicId;
        expect(res.data).not.toHaveProperty('id');
    });

    it('should return 401 for GET /lessons without token', async () => {
        setAuthToken(null);
        const response = await apiClient.get('/lessons');
        expect(response.status).toBe(401);
    });

    it('should return 403 for GET /lessons with STUDENT token', async () => {
        setAuthToken(studentToken);
        const response = await apiClient.get('/lessons');
        expect(response.status).toBe(403);
    });

    it('should return 400 VALIDATION_FAILED for invalid lesson payload', async () => {
        setAuthToken(teacherToken);
        const response = await apiClient.post('/lessons', {
            title: '   ',
            theme: '',
            groupPublicIds: []
        });
        expect(response.status).toBe(400);
        expect(response.data.code).toBe('VALIDATION_FAILED');
    });

    it('should block other TEACHER from updating lesson they do not own', async () => {
        setAuthToken(secondTeacherToken);
        const response = await apiClient.put(`/lessons/${ownLessonPublicId}`, {
            title: 'Tampered title',
            theme: 'Tampered',
            groupPublicIds: []
        });
        expect(response.status).toBe(403);
        expect(response.data.code).toBe('FORBIDDEN');
    });

    it('should block other TEACHER from changing status of lesson they do not own', async () => {
        setAuthToken(secondTeacherToken);
        const response = await apiClient.patch(`/lessons/${ownLessonPublicId}/status`, {
            isActive: false
        });
        expect(response.status).toBe(403);
        expect(response.data.code).toBe('FORBIDDEN');
    });

    it('should block other TEACHER from deleting lesson they do not own', async () => {
        setAuthToken(secondTeacherToken);
        const response = await apiClient.delete(`/lessons/${ownLessonPublicId}`);
        expect(response.status).toBe(403);
        expect(response.data.code).toBe('FORBIDDEN');
    });

    it('should allow ADMIN to update teacher lesson (200)', async () => {
        setAuthToken(adminToken);
        const response = await apiClient.put(`/lessons/${ownLessonPublicId}`, {
            title: `Admin Updated ${uniqueId}`,
            theme: 'Admin Review',
            groupPublicIds: []
        });
        expect(response.status).toBe(200);
        expect(response.data.publicId).toBe(ownLessonPublicId);
        expect(response.data).not.toHaveProperty('id');
        expect(response.data.title).toBe(`Admin Updated ${uniqueId}`);
    });

    afterAll(async () => {
        setAuthToken(adminToken);

        if (ownLessonPublicId) {
            const response = await apiClient.delete(`/lessons/${ownLessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (secondTeacherPublicId) {
            const response = await apiClient.delete(`/users/${secondTeacherPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(null);
    });
});
