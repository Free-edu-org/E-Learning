const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Student Progress Access API (/api/v1/student/progress)', () => {
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

    it('should allow STUDENT (200)', async () => {
        setAuthToken(studentToken);
        const response = await apiClient.get('/student/progress');
        expect(response.status).toBe(200);
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
