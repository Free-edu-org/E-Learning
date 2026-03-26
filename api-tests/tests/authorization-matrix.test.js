const { apiClient, setAuthToken } = require('../utils/apiClient');

function expectForbidden(response) {
    expect(response.status).toBe(403);
    if (typeof response.data === 'string') {
        expect(response.data).toBe('Access Denied');
    } else {
        expect(response.data.code).toBe('FORBIDDEN');
    }
}

describe('Authorization Matrix (Users + User Groups)', () => {
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

    let teacher1GroupId;
    let teacher2GroupId;

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
            email: `matrix.teacher.${uniqueId}@example.com`,
            username: `matrix_teacher_${uniqueId}`,
            password: 'password123'
        };
        const createTeacherRes = await apiClient.post('/users/teacher', secondTeacher);
        expect(createTeacherRes.status).toBe(201);

        res = await apiClient.post('/auth/login', {
            identifier: secondTeacher.username,
            password: secondTeacher.password
        });
        secondTeacherToken = res.data.token;

        setAuthToken(secondTeacherToken);
        res = await apiClient.get('/users/me');
        secondTeacherId = res.data.id;
    });

    describe('POST /users/teacher', () => {
        it('should return 401 for unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.post('/users/teacher', {
                email: `unauth.teacher.${uniqueId}@example.com`,
                username: `unauth_teacher_${uniqueId}`,
                password: 'password123'
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for TEACHER token', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/users/teacher', {
                email: `forbidden.teacher.${uniqueId}@example.com`,
                username: `forbidden_teacher_${uniqueId}`,
                password: 'password123'
            });
            expectForbidden(response);
        });

        it('should return 403 for STUDENT token', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post('/users/teacher', {
                email: `student.teacher.${uniqueId}@example.com`,
                username: `student_teacher_${uniqueId}`,
                password: 'password123'
            });
            expectForbidden(response);
        });
    });

    describe('GET /users/students', () => {
        it('should return 401 for unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/users/students');
            expect(response.status).toBe(401);
        });

        it('should return 500 INTERNAL_SERVER_ERROR for TEACHER token (current backend behavior)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/users/students');
            expect(response.status).toBe(500);
            expect(response.data.code).toBe('INTERNAL_SERVER_ERROR');
        });

        it('should return 500 INTERNAL_SERVER_ERROR for STUDENT token (current backend behavior)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/users/students');
            expect(response.status).toBe(500);
            expect(response.data.code).toBe('INTERNAL_SERVER_ERROR');
        });

        it('should return 500 INTERNAL_SERVER_ERROR for ADMIN token (current backend behavior)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/users/students');
            expect(response.status).toBe(500);
            expect(response.data.code).toBe('INTERNAL_SERVER_ERROR');
        });
    });

    describe('User Group Ownership (TEACHER)', () => {
        beforeAll(async () => {
            setAuthToken(teacherToken);
            let res = await apiClient.post('/user-groups', {
                name: `MatrixTeacher1Group_${uniqueId}`,
                description: 'Owned by teacher1'
            });
            expect(res.status).toBe(201);
            teacher1GroupId = res.data.id;

            setAuthToken(secondTeacherToken);
            res = await apiClient.post('/user-groups', {
                name: `MatrixTeacher2Group_${uniqueId}`,
                description: 'Owned by teacher2'
            });
            expect(res.status).toBe(201);
            teacher2GroupId = res.data.id;
        });

        it('teacher should access own group (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/user-groups/${teacher1GroupId}`);
            expect(response.status).toBe(200);
            expect(response.data.id).toBe(teacher1GroupId);
        });

        it('teacher should be blocked from foreign group (403)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/user-groups/${teacher2GroupId}`);
            expectForbidden(response);
        });

        it('teacher should be blocked from updating foreign group (403)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/user-groups/${teacher2GroupId}`, {
                name: `ShouldNotUpdate_${uniqueId}`,
                description: 'forbidden'
            });
            expectForbidden(response);
        });

        it('teacher should be blocked from deleting foreign group (403)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.delete(`/user-groups/${teacher2GroupId}`);
            expectForbidden(response);
        });

        it('teacher should update own group (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/user-groups/${teacher1GroupId}`, {
                name: `MatrixTeacher1GroupUpdated_${uniqueId}`,
                description: 'updated'
            });
            expect(response.status).toBe(200);
            expect(response.data.name).toBe(`MatrixTeacher1GroupUpdated_${uniqueId}`);
        });
    });

    describe('Teacher-owned student visibility (/users/{id})', () => {
        let createdStudentId;
        let createdStudentUsername;
        let createdStudentPassword;

        beforeAll(async () => {
            createdStudentUsername = `matrix_student_${uniqueId}`;
            createdStudentPassword = 'password123';

            setAuthToken(teacherToken);
            const createRes = await apiClient.post('/users/register', {
                email: `matrix.student.${uniqueId}@example.com`,
                username: createdStudentUsername,
                password: createdStudentPassword
            });
            expect(createRes.status).toBe(201);

            const loginRes = await apiClient.post('/auth/login', {
                identifier: createdStudentUsername,
                password: createdStudentPassword
            });
            expect(loginRes.status).toBe(200);

            setAuthToken(loginRes.data.token);
            const meRes = await apiClient.get('/users/me');
            expect(meRes.status).toBe(200);
            createdStudentId = meRes.data.id;
        });

        it('admin should see teacherId set for teacher-created student (200)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/users/${createdStudentId}`);
            expect(response.status).toBe(200);
            expect(response.data.teacherId).toBe(teacherId);
        });

        it('owning teacher should access student details (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/users/${createdStudentId}`);
            expect(response.status).toBe(200);
            expect(response.data.id).toBe(createdStudentId);
        });

        it('foreign teacher should be blocked from student details (403)', async () => {
            setAuthToken(secondTeacherToken);
            const response = await apiClient.get(`/users/${createdStudentId}`);
            expectForbidden(response);
        });
    });
});
