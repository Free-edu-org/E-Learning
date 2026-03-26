const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Teacher Dashboard Access API (/api/v1/teacher/*)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let teacherId;
    let secondTeacherToken;
    let secondTeacherId;
    let firstTeacherGroupId;
    let secondTeacherGroupId;
    let teacherStudentId;
    let foreignTeacherStudentId;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        setAuthToken(teacherToken);
        res = await apiClient.get('/users/me');
        teacherId = res.data.id;

        setAuthToken(adminToken);
        const secondTeacher = {
            email: `teacher.${uniqueId}@example.com`,
            username: `teacher_${uniqueId}`,
            password: 'password123'
        };
        await apiClient.post('/users/teacher', secondTeacher);
        res = await apiClient.post('/auth/login', {
            identifier: secondTeacher.username,
            password: secondTeacher.password
        });
        secondTeacherToken = res.data.token;

        setAuthToken(secondTeacherToken);
        res = await apiClient.get('/users/me');
        secondTeacherId = res.data.id;

        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `TeacherScopeGroup_${uniqueId}`,
            description: 'Owned by seed teacher'
        });
        firstTeacherGroupId = res.data.id;

        setAuthToken(secondTeacherToken);
        res = await apiClient.post('/user-groups', {
            name: `SecondTeacherScopeGroup_${uniqueId}`,
            description: 'Owned by second teacher'
        });
        secondTeacherGroupId = res.data.id;

        setAuthToken(adminToken);
        const teacherStudent = {
            email: `teacher.student.${uniqueId}@example.com`,
            username: `teacher_student_${uniqueId}`,
            password: 'password123'
        };
        await apiClient.post('/users/register', teacherStudent);
        res = await apiClient.post('/auth/login', {
            identifier: teacherStudent.username,
            password: teacherStudent.password
        });
        setAuthToken(res.data.token);
        res = await apiClient.get('/users/me');
        teacherStudentId = res.data.id;

        setAuthToken(adminToken);
        const foreignTeacherStudent = {
            email: `foreign.teacher.student.${uniqueId}@example.com`,
            username: `foreign_teacher_student_${uniqueId}`,
            password: 'password123'
        };
        await apiClient.post('/users/register', foreignTeacherStudent);
        res = await apiClient.post('/auth/login', {
            identifier: foreignTeacherStudent.username,
            password: foreignTeacherStudent.password
        });
        setAuthToken(res.data.token);
        res = await apiClient.get('/users/me');
        foreignTeacherStudentId = res.data.id;

        setAuthToken(teacherToken);
        await apiClient.post(`/user-groups/${firstTeacherGroupId}/members/${teacherStudentId}`);

        setAuthToken(secondTeacherToken);
        await apiClient.post(`/user-groups/${secondTeacherGroupId}/members/${foreignTeacherStudentId}`);
    });

    afterAll(async () => {
        setAuthToken(adminToken);

        if (firstTeacherGroupId) {
            const response = await apiClient.delete(`/user-groups/${firstTeacherGroupId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (secondTeacherGroupId) {
            const response = await apiClient.delete(`/user-groups/${secondTeacherGroupId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (teacherStudentId) {
            const response = await apiClient.delete(`/users/${teacherStudentId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (foreignTeacherStudentId) {
            const response = await apiClient.delete(`/users/${foreignTeacherStudentId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (secondTeacherId) {
            const response = await apiClient.delete(`/users/${secondTeacherId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(null);
    });

    it('should return 401 for /teacher/stats when unauthenticated', async () => {
        setAuthToken(null);
        const response = await apiClient.get('/teacher/stats');
        expect(response.status).toBe(401);
    });

    it('should return 403 for /teacher/stats when role is STUDENT', async () => {
        setAuthToken(studentToken);
        const response = await apiClient.get('/teacher/stats');
        expect(response.status).toBe(403);
    });

    it('should return 403 for /teacher/stats when role is ADMIN', async () => {
        setAuthToken(adminToken);
        const response = await apiClient.get('/teacher/stats');
        expect(response.status).toBe(403);
    });

    it('should return 200 for /teacher/stats when role is TEACHER', async () => {
        setAuthToken(teacherToken);
        const response = await apiClient.get('/teacher/stats');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('totalLessons');
        expect(response.data).toHaveProperty('activeLessons');
        expect(response.data).toHaveProperty('activeStudents');
        expect(response.data).toHaveProperty('avgScore');
    });

    it('should return 403 for /teacher/lessons when role is STUDENT', async () => {
        setAuthToken(studentToken);
        const response = await apiClient.get('/teacher/lessons');
        expect(response.status).toBe(403);
    });

    it('should return 403 for /teacher/lessons when role is ADMIN', async () => {
        setAuthToken(adminToken);
        const response = await apiClient.get('/teacher/lessons');
        expect(response.status).toBe(403);
    });

    it('should return only current teacher lessons for /teacher/lessons', async () => {
        setAuthToken(teacherToken);
        const response = await apiClient.get('/teacher/lessons');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        response.data.forEach((lesson) => {
            expect(lesson.teacherId).toBe(teacherId);
        });

        setAuthToken(secondTeacherToken);
        const secondTeacherResponse = await apiClient.get('/teacher/lessons');
        expect(secondTeacherResponse.status).toBe(200);
        secondTeacherResponse.data.forEach((lesson) => {
            expect(lesson.teacherId).toBe(secondTeacherId);
        });
    });

    it('should return 403 for /teacher/my-groups when role is STUDENT', async () => {
        setAuthToken(studentToken);
        const response = await apiClient.get('/teacher/my-groups');
        expect(response.status).toBe(403);
    });

    it('should return 403 for /teacher/my-groups when role is ADMIN', async () => {
        setAuthToken(adminToken);
        const response = await apiClient.get('/teacher/my-groups');
        expect(response.status).toBe(403);
    });

    it('should return only current teacher groups for /teacher/my-groups', async () => {
        setAuthToken(teacherToken);
        const response = await apiClient.get('/teacher/my-groups');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((g) => g.id === firstTeacherGroupId)).toBe(true);

        setAuthToken(secondTeacherToken);
        const secondTeacherResponse = await apiClient.get('/teacher/my-groups');
        expect(secondTeacherResponse.status).toBe(200);
        expect(secondTeacherResponse.data.some((g) => g.id === firstTeacherGroupId)).toBe(false);
    });

    it('should block TEACHER from admin-only endpoint /admin/stats', async () => {
        setAuthToken(teacherToken);
        const response = await apiClient.get('/admin/stats');
        expect(response.status).toBe(403);
    });

    it('should return 401 for /teacher/students when unauthenticated', async () => {
        setAuthToken(null);
        const response = await apiClient.get('/teacher/students');
        expect(response.status).toBe(401);
    });

    it('should return 403 for /teacher/students when role is STUDENT', async () => {
        setAuthToken(studentToken);
        const response = await apiClient.get('/teacher/students');
        expect(response.status).toBe(403);
    });

    it('should return 403 for /teacher/students when role is ADMIN', async () => {
        setAuthToken(adminToken);
        const response = await apiClient.get('/teacher/students');
        expect(response.status).toBe(403);
    });

    it('should return only current teacher students for /teacher/students', async () => {
        setAuthToken(teacherToken);
        const response = await apiClient.get('/teacher/students');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        const returnedIds = response.data.map((u) => u.id);
        expect(returnedIds).toContain(teacherStudentId);
        expect(returnedIds).not.toContain(foreignTeacherStudentId);
        response.data.forEach((u) => {
            expect(u.role).toBe('STUDENT');
            expect(u.teacherId).toBe(teacherId);
        });
    });
});
