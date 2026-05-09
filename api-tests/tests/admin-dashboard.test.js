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
    let createdAchievementCode;
    let deactivatedAchievementCode;
    const createdAchievementCodes = new Set();

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

        for (const achievementCode of createdAchievementCodes) {
            const response = await apiClient.patch(`/admin/achievements/${achievementCode}/active`, {
                active: false
            });
            expect([200, 404]).toContain(response.status);
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
                email: `admin.student.nogroup.${uniqueId}@example.com`
            });

            expect(response.status).toBe(201);
            expect(response.data.role).toBe('STUDENT');
            expect(response.data.status).toBe('INVITED');
            createdStudentPublicId = response.data.publicId;
        });

        it('should create student WITH groupPublicId for ADMIN (201)', async () => {
            setAuthToken(adminToken);
            // First delete the student created above to reuse the slot
            if (createdStudentPublicId) {
                await apiClient.delete(`/users/${createdStudentPublicId}`);
            }

            const response = await apiClient.post('/admin/students', {
                email: `admin.student.grp.${uniqueId}@example.com`,
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
                groupPublicId: 'missing-group-public-id'
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should return 409 for EMAIL_ALREADY_TAKEN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/students', {
                email: `admin.student.grp.${uniqueId}@example.com` // same email as created student
            });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
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

    describe('PUT /api/v1/admin/students/{studentPublicId}', () => {
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

    describe('Admin achievement management', () => {
        const createCode = () => `ADMIN_TEST_ACH_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

        it('should return 401 for achievement list when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/admin/achievements');
            expect(response.status).toBe(401);
        });

        it('should return 403 for achievement list when role is TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/admin/achievements');
            expect(response.status).toBe(403);
        });

        it('should create achievement for ADMIN (201)', async () => {
            setAuthToken(adminToken);
            createdAchievementCode = createCode();
            createdAchievementCodes.add(createdAchievementCode);

            const response = await apiClient.post('/admin/achievements', {
                code: createdAchievementCode,
                title: `Admin Test Achievement ${uniqueId}`,
                description: 'Created from API test',
                icon: 'icon',
                color: 'warning',
                type: 'LESSONS_COMPLETED',
                threshold: 2,
                active: true,
                sortOrder: 9000
            });

            expect(response.status).toBe(201);
            expect(response.data.code).toBe(createdAchievementCode);
            expect(response.data.title).toBe(`Admin Test Achievement ${uniqueId}`);
            expect(response.data).not.toHaveProperty('id');
        });

        it('should list achievements for ADMIN and keep sorting by sortOrder', async () => {
            setAuthToken(adminToken);
            const earlyCode = createCode();
            const lateCode = createCode();
            createdAchievementCodes.add(earlyCode);
            createdAchievementCodes.add(lateCode);

            let response = await apiClient.post('/admin/achievements', {
                code: earlyCode,
                title: `Admin Test Achievement ${uniqueId} Early`,
                description: 'Early sort order',
                icon: 'icon',
                color: 'warning',
                type: 'LESSONS_COMPLETED',
                threshold: 1,
                active: true,
                sortOrder: 8000
            });
            expect(response.status).toBe(201);

            response = await apiClient.post('/admin/achievements', {
                code: lateCode,
                title: `Admin Test Achievement ${uniqueId} Late`,
                description: 'Late sort order',
                icon: 'icon',
                color: 'warning',
                type: 'POINTS',
                threshold: 20,
                active: true,
                sortOrder: 8001
            });
            expect(response.status).toBe(201);

            response = await apiClient.get('/admin/achievements');
            expect(response.status).toBe(200);
            const earlyIndex = response.data.findIndex((item) => item.code === earlyCode);
            const lateIndex = response.data.findIndex((item) => item.code === lateCode);
            expect(earlyIndex).toBeGreaterThanOrEqual(0);
            expect(lateIndex).toBeGreaterThanOrEqual(0);
            expect(earlyIndex).toBeLessThan(lateIndex);
        });

        it('should get achievement by code for ADMIN (200)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/admin/achievements/${createdAchievementCode}`);
            expect(response.status).toBe(200);
            expect(response.data.code).toBe(createdAchievementCode);
            expect(response.data.type).toBe('LESSONS_COMPLETED');
        });

        it('should return 404 for missing achievement code', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/admin/achievements/MISSING_ACHIEVEMENT_CODE');
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('ACHIEVEMENT_NOT_FOUND');
        });

        it('should return 409 for duplicate achievement code', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/achievements', {
                code: createdAchievementCode,
                title: 'Duplicate code',
                description: 'Duplicate code',
                icon: 'icon',
                color: 'warning',
                type: 'LESSONS_COMPLETED',
                threshold: 1,
                active: true,
                sortOrder: 9001
            });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('ACHIEVEMENT_CODE_ALREADY_EXISTS');
        });

        it('should return 400 for invalid code format', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/achievements', {
                code: 'bad-code',
                title: 'Bad code',
                description: 'Bad code',
                icon: 'icon',
                color: 'warning',
                type: 'LESSONS_COMPLETED',
                threshold: 1,
                active: true,
                sortOrder: 9002
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should return 400 for invalid threshold rule', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/admin/achievements', {
                code: createCode(),
                title: 'Bad threshold',
                description: 'Bad threshold',
                icon: 'icon',
                color: 'warning',
                type: 'AVATAR_CHANGED',
                threshold: 1,
                active: true,
                sortOrder: 9003
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('INVALID_ACHIEVEMENT_RULE');
        });

        it('should update editable fields without changing code or type', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/admin/achievements/${createdAchievementCode}`, {
                code: 'SHOULD_NOT_CHANGE',
                type: 'AVATAR_CHANGED',
                title: 'Updated achievement title',
                description: 'Updated achievement description',
                icon: 'updated-icon',
                color: 'success',
                threshold: 5,
                active: true,
                sortOrder: 9100
            });

            expect(response.status).toBe(200);
            expect(response.data.code).toBe(createdAchievementCode);
            expect(response.data.type).toBe('LESSONS_COMPLETED');
            expect(response.data.title).toBe('Updated achievement title');
            expect(response.data.threshold).toBe(5);
        });

        it('should return 400 for invalid update payload on achievement edit', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/admin/achievements/${createdAchievementCode}`, {
                title: '',
                description: 'Invalid update payload',
                icon: 'updated-icon',
                color: 'success',
                threshold: 0,
                active: true,
                sortOrder: 9101
            });

            expect(response.status).toBe(400);
            expect(['VALIDATION_FAILED', 'INVALID_ACHIEVEMENT_RULE']).toContain(response.data.code);
        });

        it('should deactivate and reactivate achievement via PATCH active', async () => {
            setAuthToken(adminToken);
            deactivatedAchievementCode = createCode();
            createdAchievementCodes.add(deactivatedAchievementCode);

            let response = await apiClient.post('/admin/achievements', {
                code: deactivatedAchievementCode,
                title: `Admin Test Achievement ${uniqueId} Hidden`,
                description: 'Will be hidden from student list',
                icon: 'icon',
                color: 'warning',
                type: 'POINTS',
                threshold: 999999,
                active: true,
                sortOrder: 9200
            });
            expect(response.status).toBe(201);

            response = await apiClient.patch(`/admin/achievements/${deactivatedAchievementCode}/active`, {
                active: false
            });
            expect(response.status).toBe(200);
            expect(response.data.active).toBe(false);

            setAuthToken(studentToken);
            response = await apiClient.get('/student/achievements');
            expect(response.status).toBe(200);
            expect(response.data.some((item) => item.title === `Admin Test Achievement ${uniqueId} Hidden`)).toBe(false);

            setAuthToken(adminToken);
            response = await apiClient.patch(`/admin/achievements/${deactivatedAchievementCode}/active`, {
                active: true
            });
            expect(response.status).toBe(200);
            expect(response.data.active).toBe(true);
        });
    });
});
