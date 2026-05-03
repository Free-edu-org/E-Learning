const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Admin Dashboard API (/api/v1/admin)', () => {
    const uniqueId = Date.now();
    const freshId = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let createdTeacherPublicId;
    let createdStudentPublicId;
    let seedGroupPublicId;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        setAuthToken(adminToken);
        res = await apiClient.get('/user-groups');
        const seedGroup = res.data.find((group) => group.name === 'Angielski A1');
        seedGroupPublicId = seedGroup.publicId;
    });

    afterAll(async () => {
        setAuthToken(adminToken);

        if (createdStudentPublicId) {
            const response = await apiClient.delete(`/users/${createdStudentPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (createdTeacherPublicId) {
            const response = await apiClient.delete(`/users/${createdTeacherPublicId}`);
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
                password: 'password123'
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/admin/students', {
                email: `teacher.forbidden.${uniqueId}@example.com`,
                username: `teacher_forbidden_${uniqueId}`,
                password: 'password123'
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 for STUDENT', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post('/admin/students', {
                email: `student.forbidden.${uniqueId}@example.com`,
                username: `student_forbidden_${uniqueId}`,
                password: 'password123'
            });
            expect(response.status).toBe(403);
        });

        it('should create student WITHOUT groupPublicId for ADMIN (201)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/students', {
                email: `admin.student.nogroup.${uniqueId}@example.com`,
                username: `admin_student_nogroup_${uniqueId}`,
                password: 'password123'
            });

            expect(response.status).toBe(201);
            expect(response.data.role).toBe('STUDENT');
            createdStudentPublicId = response.data.publicId;

            // Verify student can login
            setAuthToken(null);
            const loginResponse = await apiClient.post('/auth/login', {
                identifier: `admin_student_nogroup_${uniqueId}`,
                password: 'password123'
            });
            expect(loginResponse.status).toBe(200);
        });

        it('should create student WITH groupPublicId for ADMIN (201)', async () => {
            setAuthToken(adminToken);
            // First delete the student created above to reuse the slot
            if (createdStudentPublicId) {
                await apiClient.delete(`/users/${createdStudentPublicId}`);
            }

            const response = await apiClient.post('/admin/students', {
                email: `admin.student.grp.${uniqueId}@example.com`,
                username: `admin_student_grp_${uniqueId}`,
                password: 'password123',
                groupPublicId: seedGroupPublicId
            });

            expect(response.status).toBe(201);
            expect(response.data.role).toBe('STUDENT');
            createdStudentPublicId = response.data.publicId;
        });

        it('should return 404 for non-existent groupPublicId', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/students', {
                email: `admin.student.badgrp.${uniqueId}@example.com`,
                username: `admin_student_badgrp_${uniqueId}`,
                password: 'password123',
                groupPublicId: 'missing-group-public-id'
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should return 409 for EMAIL_ALREADY_TAKEN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/students', {
                email: `admin.student.grp.${uniqueId}@example.com`, // same email as created student
                username: `admin_student_dup_${uniqueId}`,
                password: 'password123'
            });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
        });

        it('should return 409 for USERNAME_ALREADY_TAKEN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/students', {
                email: `admin.student.dup2.${uniqueId}@example.com`,
                username: `admin_student_grp_${uniqueId}`, // same username as created student
                password: 'password123'
            });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('USERNAME_ALREADY_TAKEN');
        });

        it('should return 400 for VALIDATION_FAILED (missing fields)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/students', {
                email: 'invalid',
                username: '',
                password: ''
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    describe('PUT /api/v1/admin/students/{id}', () => {
        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.put(`/admin/students/${createdStudentPublicId}`, {
                email: `unauth.upd.${uniqueId}@example.com`,
                username: `unauth_upd_${uniqueId}`
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/admin/students/${createdStudentPublicId}`, {
                email: `teacher.upd.${uniqueId}@example.com`,
                username: `teacher_upd_${uniqueId}`
            });
            expect(response.status).toBe(403);
        });

        it('should update student with groupPublicId for ADMIN (200)', async () => {
            const updateId = freshId();
            setAuthToken(adminToken);
            const response = await apiClient.put(`/admin/students/${createdStudentPublicId}`, {
                email: `admin.student.updated.${updateId}@example.com`,
                username: `admin_student_updated_${updateId}`,
                groupPublicId: seedGroupPublicId
            });

            expect(response.status).toBe(200);
            expect(response.data.publicId).toBe(createdStudentPublicId);
            expect(response.data.groupPublicId).toBe(seedGroupPublicId);
            expect(response.data.groupName).toBeTruthy();
            expect(response.data).not.toHaveProperty('teacherId');
            expect(response.data).not.toHaveProperty('teacherName');
        });

        it('should unassign student from group when groupPublicId is null (200)', async () => {
            const updateId = freshId();
            setAuthToken(adminToken);
            const response = await apiClient.put(`/admin/students/${createdStudentPublicId}`, {
                email: `admin.student.updated.${updateId}@example.com`,
                username: `admin_student_updated_${updateId}`,
                groupPublicId: null
            });

            expect(response.status).toBe(200);
            expect(response.data.publicId).toBe(createdStudentPublicId);
            expect(response.data.groupPublicId).toBeNull();
            expect(response.data.groupName).toBeNull();
        });

        it('should return 404 for non-existent student', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put('/admin/students/999999', {
                email: `notfound.${uniqueId}@example.com`,
                username: `notfound_${uniqueId}`
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_NOT_FOUND');
        });

        it('should return 404 for non-existent groupPublicId', async () => {
            const updateId = freshId();
            setAuthToken(adminToken);
            const response = await apiClient.put(`/admin/students/${createdStudentPublicId}`, {
                email: `admin.student.updated.${updateId}@example.com`,
                username: `admin_student_updated_${updateId}`,
                groupPublicId: 'missing-group-public-id'
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should return 400 for VALIDATION_FAILED', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/admin/students/${createdStudentPublicId}`, {
                email: 'invalid',
                username: ''
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
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
            createdTeacherPublicId = response.data.publicId;
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
            expect(response.data.some((user) => user.publicId === createdTeacherPublicId)).toBe(true);
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
            expect(response.data.some((user) => user.publicId === createdStudentPublicId)).toBe(true);
            response.data.forEach((user) => {
                expect(user.role).toBe('STUDENT');
                expect(user).toHaveProperty('groupPublicId');
            });
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
