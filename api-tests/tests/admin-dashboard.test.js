const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Admin Dashboard API (/api/v1/admin)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let createdTeacherId;
    let createdStudentId;
    let seedTeacherId;
    let seedGroupId;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        setAuthToken(adminToken);
        res = await apiClient.get('/admin/teachers');
        const seedTeacher = res.data.find((user) => user.username === teacherCreds.identifier);
        seedTeacherId = seedTeacher.id;

        res = await apiClient.get('/user-groups');
        const seedGroup = res.data.find((group) => group.name === 'Angielski A1');
        seedGroupId = seedGroup.id;
    });

    afterAll(async () => {
        setAuthToken(adminToken);

        if (createdTeacherId) {
            const response = await apiClient.delete(`/users/${createdTeacherId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (createdStudentId) {
            const response = await apiClient.delete(`/users/${createdStudentId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(null);
    });

    describe('GET /api/v1/admin/stats', () => {
        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/admin/stats');
            expect(response.status).toBe(401);
        });

        it('should return 403 for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/admin/stats');
            expect(response.status).toBe(403);
        });

        it('should return 403 for STUDENT', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/admin/stats');
            expect(response.status).toBe(403);
        });

        it('should return aggregated admin stats for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/admin/stats');
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('totalUsers');
            expect(response.data).toHaveProperty('totalAdmins');
            expect(response.data).toHaveProperty('totalTeachers');
            expect(response.data).toHaveProperty('totalStudents');
            expect(response.data).toHaveProperty('totalGroups');
            expect(response.data.totalUsers).toBeGreaterThanOrEqual(1);
            expect(response.data.totalAdmins).toBeGreaterThanOrEqual(1);
            expect(response.data.totalTeachers).toBeGreaterThanOrEqual(1);
            expect(response.data.totalStudents).toBeGreaterThanOrEqual(1);
        });
    });

    describe('POST /api/v1/admin/students', () => {
        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.post('/admin/students', {
                email: `unauth.student.${uniqueId}@example.com`,
                username: `unauth_student_${uniqueId}`,
                password: 'password123',
                teacherId: seedTeacherId
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/admin/students', {
                email: `teacher.forbidden.${uniqueId}@example.com`,
                username: `teacher_forbidden_${uniqueId}`,
                password: 'password123',
                teacherId: seedTeacherId
            });
            expect(response.status).toBe(403);
        });

        it('should create student with assigned teacher and optional group for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/students', {
                email: `admin.student.${uniqueId}@example.com`,
                username: `admin_student_${uniqueId}`,
                password: 'password123',
                teacherId: seedTeacherId,
                groupId: seedGroupId
            });

            expect(response.status).toBe(201);
            expect(response.data.role).toBe('STUDENT');
            expect(response.data.teacherId).toBe(seedTeacherId);
            createdStudentId = response.data.id;

            setAuthToken(null);
            const loginResponse = await apiClient.post('/auth/login', {
                identifier: `admin_student_${uniqueId}`,
                password: 'password123'
            });
            expect(loginResponse.status).toBe(200);
        });
    });

    describe('PUT /api/v1/admin/students/{id}', () => {
        it('should update student teacher and group for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/admin/students/${createdStudentId}`, {
                email: `admin.student.updated.${uniqueId}@example.com`,
                username: `admin_student_updated_${uniqueId}`,
                teacherId: seedTeacherId,
                groupId: seedGroupId
            });

            expect(response.status).toBe(200);
            expect(response.data.id).toBe(createdStudentId);
            expect(response.data.teacherId).toBe(seedTeacherId);
            expect(response.data.groupId).toBe(seedGroupId);
            expect(response.data.teacherName).toBeTruthy();
            expect(response.data.groupName).toBeTruthy();
        });
    });

    describe('GET /api/v1/admin/teachers and /students', () => {
        beforeAll(async () => {
            setAuthToken(adminToken);

            const teacherPayload = {
                email: `admin.teacher.${uniqueId}@example.com`,
                username: `admin_teacher_${uniqueId}`,
                password: 'password123'
            };
            let response = await apiClient.post('/users/teacher', teacherPayload);
            expect(response.status).toBe(201);

            response = await apiClient.post('/auth/login', {
                identifier: teacherPayload.username,
                password: teacherPayload.password
            });
            setAuthToken(response.data.token);
            response = await apiClient.get('/users/me');
            createdTeacherId = response.data.id;
        });

        it('should return 401 for teachers list when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/admin/teachers');
            expect(response.status).toBe(401);
        });

        it('should return 403 for teachers list when role is TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/admin/teachers');
            expect(response.status).toBe(403);
        });

        it('should return all teachers for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/admin/teachers');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.some((user) => user.id === createdTeacherId)).toBe(true);
            response.data.forEach((user) => {
                expect(user.role).toBe('TEACHER');
            });
        });

        it('should return 401 for students list when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/admin/students');
            expect(response.status).toBe(401);
        });

        it('should return 403 for students list when role is STUDENT', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/admin/students');
            expect(response.status).toBe(403);
        });

        it('should return all students for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/admin/students');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.some((user) => user.id === createdStudentId)).toBe(true);
            response.data.forEach((user) => {
                expect(user.role).toBe('STUDENT');
            });
            const createdStudent = response.data.find((user) => user.id === createdStudentId);
            expect(createdStudent.teacherName).toBeTruthy();
        });

        it('should increase stats after creating teacher and student', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/admin/stats');
            expect(response.status).toBe(200);
            expect(response.data.totalTeachers).toBeGreaterThanOrEqual(2);
            expect(response.data.totalStudents).toBeGreaterThanOrEqual(3);
        });
    });
});
