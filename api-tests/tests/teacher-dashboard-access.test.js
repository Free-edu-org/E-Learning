const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Teacher Dashboard Access API (/api/v1/teacher/*)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let teacherPublicId;
    let secondTeacherToken;
    let secondteacherPublicId;
    let firstTeacherGroupPublicId;
    let secondTeacherGroupPublicId;
    let teacherStudentPublicId;
    let foreignteacherStudentPublicId;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;

        setAuthToken(teacherToken);
        res = await apiClient.get('/users/me');
        teacherPublicId = res.data.publicId;

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
        secondteacherPublicId = res.data.publicId;

        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `TeacherScopeGroup_${uniqueId}`,
            description: 'Owned by seed teacher'
        });
        firstTeacherGroupPublicId = res.data.publicId;

        setAuthToken(secondTeacherToken);
        res = await apiClient.post('/user-groups', {
            name: `SecondTeacherScopeGroup_${uniqueId}`,
            description: 'Owned by second teacher'
        });
        secondTeacherGroupPublicId = res.data.publicId;

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
        teacherStudentPublicId = res.data.publicId;

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
        foreignteacherStudentPublicId = res.data.publicId;

        setAuthToken(teacherToken);
        await apiClient.post(`/user-groups/${firstTeacherGroupPublicId}/members/${teacherStudentPublicId}`);

        setAuthToken(secondTeacherToken);
        await apiClient.post(`/user-groups/${secondTeacherGroupPublicId}/members/${foreignteacherStudentPublicId}`);
    });

    afterAll(async () => {
        setAuthToken(adminToken);

        if (firstTeacherGroupPublicId) {
            const response = await apiClient.delete(`/user-groups/${firstTeacherGroupPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (secondTeacherGroupPublicId) {
            const response = await apiClient.delete(`/user-groups/${secondTeacherGroupPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (teacherStudentPublicId) {
            const response = await apiClient.delete(`/users/${teacherStudentPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (foreignteacherStudentPublicId) {
            const response = await apiClient.delete(`/users/${foreignteacherStudentPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (secondteacherPublicId) {
            const response = await apiClient.delete(`/users/${secondteacherPublicId}`);
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
            expect(lesson.teacherPublicId).toBe(teacherPublicId);
            expect(lesson).toHaveProperty('teacherAvatarUrl');
        });

        setAuthToken(secondTeacherToken);
        const secondTeacherResponse = await apiClient.get('/teacher/lessons');
        expect(secondTeacherResponse.status).toBe(200);
        secondTeacherResponse.data.forEach((lesson) => {
            expect(lesson.teacherPublicId).toBe(secondteacherPublicId);
            expect(lesson).toHaveProperty('teacherAvatarUrl');
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
        expect(response.data.some((g) => g.publicId === firstTeacherGroupPublicId)).toBe(true);
        expect(response.data.every((g) => !Object.prototype.hasOwnProperty.call(g, 'id'))).toBe(true);

        setAuthToken(secondTeacherToken);
        const secondTeacherResponse = await apiClient.get('/teacher/my-groups');
        expect(secondTeacherResponse.status).toBe(200);
        expect(secondTeacherResponse.data.some((g) => g.publicId === firstTeacherGroupPublicId)).toBe(false);
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
        const response = await apiClient.get('/teacher/students');
        expect(response.status).toBe(403);
    });

    it('should return only current teacher students for /teacher/students', async () => {
        setAuthToken(teacherToken);
        const response = await apiClient.get('/teacher/students');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        const returnedIds = response.data.map((u) => u.publicId);
        expect(returnedIds).toContain(teacherStudentPublicId);
        expect(returnedIds).not.toContain(foreignteacherStudentPublicId);
        response.data.forEach((u) => {
            expect(u.role).toBe('STUDENT');
            expect(u).toHaveProperty('avatarUrl');
        });
    });

    describe('POST /api/v1/teacher/students', () => {
        const createdStudentPublicIds = [];

        afterAll(async () => {
            setAuthToken(adminToken);
            for (const studentPublicId of createdStudentPublicIds.reverse()) {
                const response = await apiClient.delete(`/users/${studentPublicId}`);
                expect([204, 404]).toContain(response.status);
            }
        });

        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.post('/teacher/students', {
                email: `unauth.ts.${uniqueId}@example.com`,
                username: `unauth_ts_${uniqueId}`,
                password: 'password123',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for STUDENT', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post('/teacher/students', {
                email: `stud.ts.${uniqueId}@example.com`,
                username: `stud_ts_${uniqueId}`,
                password: 'password123',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/teacher/students', {
                email: `admin.ts.${uniqueId}@example.com`,
                username: `admin_ts_${uniqueId}`,
                password: 'password123',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(403);
        });

        it('should create student in own group for TEACHER (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/teacher/students', {
                email: `teacher.new.student.${uniqueId}@example.com`,
                username: `teacher_new_student_${uniqueId}`,
                password: 'password123',
                groupPublicId: firstTeacherGroupPublicId
            });

            expect(response.status).toBe(201);
            expect(response.data.role).toBe('STUDENT');
            expect(response.data.email).toBe(`teacher.new.student.${uniqueId}@example.com`);
            expect(response.data.username).toBe(`teacher_new_student_${uniqueId}`);
            expect(response.data).toHaveProperty('publicId');
            expect(response.data).toHaveProperty('createdAt');
            expect(response.data).toHaveProperty('avatarUrl');
            createdStudentPublicIds.push(response.data.publicId);

            // Verify created student appears in teacher's students list
            const studentsResponse = await apiClient.get('/teacher/students');
            expect(studentsResponse.status).toBe(200);
            expect(studentsResponse.data.some((s) => s.publicId === response.data.publicId)).toBe(true);
        });

        it('should reject creating student in foreign teacher group (400 INVALID_ROLE_FOR_GROUP)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/teacher/students', {
                email: `teacher.foreign.grp.${uniqueId}@example.com`,
                username: `teacher_foreign_grp_${uniqueId}`,
                password: 'password123',
                groupPublicId: secondTeacherGroupPublicId
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('INVALID_ROLE_FOR_GROUP');
        });

        it('should reject non-existent groupPublicId (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/teacher/students', {
                email: `teacher.nogrp.${uniqueId}@example.com`,
                username: `teacher_nogrp_${uniqueId}`,
                password: 'password123',
                groupPublicId: 'missing-group-public-id'
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should reject missing groupPublicId (400 VALIDATION_FAILED)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/teacher/students', {
                email: `teacher.noid.${uniqueId}@example.com`,
                username: `teacher_noid_${uniqueId}`,
                password: 'password123'
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should reject invalid payload (400 VALIDATION_FAILED)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/teacher/students', {
                email: 'not-an-email',
                username: '',
                password: '',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should return 409 for EMAIL_ALREADY_TAKEN', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/teacher/students', {
                email: `teacher.new.student.${uniqueId}@example.com`,
                username: `teacher_dup_check_${uniqueId}`,
                password: 'password123',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
        });

        it('should return 409 for USERNAME_ALREADY_TAKEN', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/teacher/students', {
                email: `teacher.dup.username.${uniqueId}@example.com`,
                username: `teacher_new_student_${uniqueId}`,
                password: 'password123',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('USERNAME_ALREADY_TAKEN');
        });
    });

    describe('PUT /api/v1/teacher/students/{studentPublicId}', () => {
        let updatableStudentPublicId;

        beforeAll(async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post('/teacher/students', {
                email: `teacher.upd.base.${uniqueId}@example.com`,
                username: `teacher_upd_base_${uniqueId}`,
                password: 'password123',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(res.status).toBe(201);
            updatableStudentPublicId = res.data.publicId;
        });

        afterAll(async () => {
            setAuthToken(adminToken);
            if (updatableStudentPublicId) {
                const response = await apiClient.delete(`/users/${updatableStudentPublicId}`);
                expect([204, 404]).toContain(response.status);
            }
        });

        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);
            const response = await apiClient.put(`/teacher/students/${updatableStudentPublicId}`, {
                email: `unauth.upd.${uniqueId}@example.com`,
                username: `unauth_upd_${uniqueId}`,
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for STUDENT', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.put(`/teacher/students/${updatableStudentPublicId}`, {
                email: `stud.upd.${uniqueId}@example.com`,
                username: `stud_upd_${uniqueId}`,
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/teacher/students/${updatableStudentPublicId}`, {
                email: `admin.upd.${uniqueId}@example.com`,
                username: `admin_upd_${uniqueId}`,
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(403);
        });

        it('should update student in own group for TEACHER (200)', async () => {
            const uid = Date.now();
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/teacher/students/${updatableStudentPublicId}`, {
                email: `teacher.upd.ok.${uid}@example.com`,
                username: `teacher_upd_ok_${uid}`,
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(200);
            expect(response.data.publicId).toBe(updatableStudentPublicId);
            expect(response.data.role).toBe('STUDENT');
            expect(response.data.groupPublicId).toBe(firstTeacherGroupPublicId);
            expect(response.data).toHaveProperty('avatarUrl');
        });

        it('should return 400 INVALID_ROLE_FOR_GROUP when moving student to foreign group', async () => {
            const uid = Date.now();
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/teacher/students/${updatableStudentPublicId}`, {
                email: `teacher.upd.fg.${uid}@example.com`,
                username: `teacher_upd_fg_${uid}`,
                groupPublicId: secondTeacherGroupPublicId
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('INVALID_ROLE_FOR_GROUP');
        });

        it('should return 404 USER_NOT_FOUND for non-existent student', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put('/teacher/students/non-existent-user', {
                email: `notfound.upd.${uniqueId}@example.com`,
                username: `notfound_upd_${uniqueId}`,
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_NOT_FOUND');
        });

        it('should return 403 when updating student not owned by teacher', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/teacher/students/${foreignteacherStudentPublicId}`, {
                email: `teacher.hijack.${uniqueId}@example.com`,
                username: `teacher_hijack_${uniqueId}`,
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(403);
        });

        it('should return 400 VALIDATION_FAILED for invalid payload', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/teacher/students/${updatableStudentPublicId}`, {
                email: 'not-an-email',
                username: '',
                groupPublicId: firstTeacherGroupPublicId
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });
});
