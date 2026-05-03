const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Lesson Result Details API', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken, teacherToken;
    let teacherUserId;
    let studentToken, studentId;
    let foreignStudentToken, foreignStudentId;
    let otherTeacherToken, otherTeacherId;
    let groupPublicId, lessonPublicId, emptyLessonPublicId;
    let chooseTaskId, writeTaskId;

    beforeAll(async () => {
        let response;

        response = await apiClient.post('/auth/login', adminCreds);
        adminToken = response.data.token;

        response = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = response.data.token;

        setAuthToken(teacherToken);
        response = await apiClient.get('/users/me');
        teacherUserId = response.data.id;

        response = await apiClient.post('/user-groups', {
            name: `Result Group ${uniqueId}`,
            description: 'Group for lesson result details tests'
        });
        expect(response.status).toBe(201);
        groupPublicId = response.data.publicId;

        response = await apiClient.post('/lessons', {
            title: `Result Lesson ${uniqueId}`,
            theme: 'Result details testing',
            groupPublicIds: [groupPublicId]
        });
        expect(response.status).toBe(201);
        lessonPublicId = response.data.publicId;
        expect(response.data).not.toHaveProperty('id');

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
            task: 'Choose the right option',
            possibleAnswers: 'red|green|blue',
            correctAnswer: 1,
            hint: 'Pick the second answer',
            section: 'Quiz'
        });
        expect(response.status).toBe(201);
        chooseTaskId = response.data.id;

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
            task: 'Write the word "hello"',
            correctAnswer: 'hello',
            hint: 'Simple greeting',
            section: 'Writing'
        });
        expect(response.status).toBe(201);
        writeTaskId = response.data.id;

        response = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: true });
        expect(response.status).toBe(204);

        response = await apiClient.post('/lessons', {
            title: `Empty Result ${uniqueId}`,
            theme: 'No submission yet',
            groupPublicIds: [groupPublicId]
        });
        expect(response.status).toBe(201);
        emptyLessonPublicId = response.data.publicId;
        expect(response.data).not.toHaveProperty('id');

        setAuthToken(adminToken);
        const studentData = {
            email: `lesson.result.student.${uniqueId}@test.com`,
            username: `lesson_result_student_${uniqueId}`,
            password: 'password123'
        };
        response = await apiClient.post('/users/register', studentData);
        expect(response.status).toBe(201);

        response = await apiClient.post('/auth/login', {
            identifier: studentData.username,
            password: studentData.password
        });
        studentToken = response.data.token;

        setAuthToken(studentToken);
        response = await apiClient.get('/users/me');
        studentId = response.data.id;

        setAuthToken(adminToken);
        response = await apiClient.post(`/user-groups/${groupPublicId}/members/${studentId}`);
        expect(response.status).toBe(204);

        const foreignStudentData = {
            email: `lesson.result.foreign.${uniqueId}@test.com`,
            username: `lesson_result_foreign_${uniqueId}`,
            password: 'password123'
        };
        response = await apiClient.post('/users/register', foreignStudentData);
        expect(response.status).toBe(201);

        response = await apiClient.post('/auth/login', {
            identifier: foreignStudentData.username,
            password: foreignStudentData.password
        });
        foreignStudentToken = response.data.token;

        setAuthToken(foreignStudentToken);
        response = await apiClient.get('/users/me');
        foreignStudentId = response.data.id;

        setAuthToken(adminToken);
        const otherTeacherData = {
            email: `lesson.result.teacher.${uniqueId}@test.com`,
            username: `lesson_result_teacher_${uniqueId}`,
            password: 'password123'
        };
        response = await apiClient.post('/users/teacher', otherTeacherData);
        expect(response.status).toBe(201);

        response = await apiClient.post('/auth/login', {
            identifier: otherTeacherData.username,
            password: otherTeacherData.password
        });
        otherTeacherToken = response.data.token;

        setAuthToken(otherTeacherToken);
        response = await apiClient.get('/users/me');
        otherTeacherId = response.data.id;

        setAuthToken(studentToken);
        response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
        expect(response.status).toBe(200);
        expect(response.data.lessonPublicId).toBe(lessonPublicId);
        expect(response.data).not.toHaveProperty('lessonId');

        response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
            answers: [
                { taskId: chooseTaskId, taskType: 'choose', answer: '1' },
                { taskId: writeTaskId, taskType: 'write', answer: 'wrong-answer' }
            ]
        });
        expect(response.status).toBe(200);
        expect(response.data.score).toBe(1);
        expect(response.data.maxScore).toBe(2);
    });

    afterAll(async () => {
        setAuthToken(teacherToken);
        if (lessonPublicId && studentId) {
            const resetResponse = await apiClient.post(`/lessons/${lessonPublicId}/users/${studentId}/reset`);
            expect([204, 404]).toContain(resetResponse.status);
        }

        for (const [type, taskId] of [['choose', chooseTaskId], ['write', writeTaskId]]) {
            if (lessonPublicId && taskId) {
                const deleteTaskResponse = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/${type}/${taskId}`);
                expect([204, 404]).toContain(deleteTaskResponse.status);
            }
        }

        for (const lessonToDelete of [lessonPublicId, emptyLessonPublicId]) {
            if (lessonToDelete) {
                const deleteLessonResponse = await apiClient.delete(`/lessons/${lessonToDelete}`);
                expect([204, 404]).toContain(deleteLessonResponse.status);
            }
        }

        setAuthToken(adminToken);
        if (groupPublicId) {
            const deleteGroupResponse = await apiClient.delete(`/user-groups/${groupPublicId}`);
            expect([204, 404]).toContain(deleteGroupResponse.status);
        }

        for (const userId of [studentId, foreignStudentId, otherTeacherId]) {
            if (userId) {
                const deleteUserResponse = await apiClient.delete(`/users/${userId}`);
                expect([204, 404]).toContain(deleteUserResponse.status);
            }
        }

        setAuthToken(null);
    });

    describe('GET /api/v1/teacher/lessons/{lessonPublicId}/students/{userId}/result', () => {
        it('should return 200 with detailed lesson result for lesson owner', async () => {
            setAuthToken(teacherToken);

            const response = await apiClient.get(`/teacher/lessons/${lessonPublicId}/students/${studentId}/result`);

            expect(response.status).toBe(200);
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data.userId).toBe(studentId);
            expect(response.data.username).toBeDefined();
            expect(response.data.score).toBe(1);
            expect(response.data.maxScore).toBe(2);
            expect(response.data.tasks).toHaveLength(2);
        });

        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);

            const response = await apiClient.get(`/teacher/lessons/${lessonPublicId}/students/${studentId}/result`);

            expect(response.status).toBe(401);
        });

        it('should return 403 for STUDENT role', async () => {
            setAuthToken(studentToken);

            const response = await apiClient.get(`/teacher/lessons/${lessonPublicId}/students/${studentId}/result`);

            expect(response.status).toBe(403);
        });

        it('should return 403 for ADMIN role', async () => {
            setAuthToken(adminToken);

            const response = await apiClient.get(`/teacher/lessons/${lessonPublicId}/students/${studentId}/result`);

            expect(response.status).toBe(403);
        });

        it('should return 403 for teacher who does not own the lesson', async () => {
            setAuthToken(otherTeacherToken);

            const response = await apiClient.get(`/teacher/lessons/${lessonPublicId}/students/${studentId}/result`);

            expect(response.status).toBe(403);
        });

        it('should return 403 STUDENT_NO_ACCESS when requested student is outside lesson relation', async () => {
            setAuthToken(teacherToken);

            const response = await apiClient.get(`/teacher/lessons/${lessonPublicId}/students/${foreignStudentId}/result`);

            expect(response.status).toBe(403);
            expect(response.data.code).toBe('STUDENT_NO_ACCESS');
        });

        it('should return 404 LESSON_RESULT_NOT_FOUND when student has no completed result', async () => {
            setAuthToken(teacherToken);

            const response = await apiClient.get(`/teacher/lessons/${emptyLessonPublicId}/students/${studentId}/result`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('LESSON_RESULT_NOT_FOUND');
        });

        it('should return 404 LESSON_NOT_FOUND when lesson does not exist', async () => {
            setAuthToken(teacherToken);

            const response = await apiClient.get(`/teacher/lessons/999999/students/${studentId}/result`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('LESSON_NOT_FOUND');
        });
    });

    describe('GET /api/v1/student/lessons/{lessonPublicId}/result', () => {
        it('should return 200 with current student result details', async () => {
            setAuthToken(studentToken);

            const response = await apiClient.get(`/student/lessons/${lessonPublicId}/result`);

            expect(response.status).toBe(200);
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data.userId).toBe(studentId);
            expect(response.data.score).toBe(1);
            expect(response.data.maxScore).toBe(2);
            expect(response.data.tasks).toHaveLength(2);
        });

        it('should return 401 when unauthenticated', async () => {
            setAuthToken(null);

            const response = await apiClient.get(`/student/lessons/${lessonPublicId}/result`);

            expect(response.status).toBe(401);
        });

        it('should return 403 for TEACHER role', async () => {
            setAuthToken(teacherToken);

            const response = await apiClient.get(`/student/lessons/${lessonPublicId}/result`);

            expect(response.status).toBe(403);
        });

        it('should return 403 for ADMIN role', async () => {
            setAuthToken(adminToken);

            const response = await apiClient.get(`/student/lessons/${lessonPublicId}/result`);

            expect(response.status).toBe(403);
        });

        it('should return 403 STUDENT_NO_ACCESS for student outside lesson group', async () => {
            setAuthToken(foreignStudentToken);

            const response = await apiClient.get(`/student/lessons/${lessonPublicId}/result`);

            expect(response.status).toBe(403);
            expect(response.data.code).toBe('STUDENT_NO_ACCESS');
        });

        it('should return 404 LESSON_RESULT_NOT_FOUND when lesson is assigned but not completed', async () => {
            setAuthToken(studentToken);

            const response = await apiClient.get(`/student/lessons/${emptyLessonPublicId}/result`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('LESSON_RESULT_NOT_FOUND');
        });

        it('should return 404 LESSON_NOT_FOUND when lesson does not exist', async () => {
            setAuthToken(studentToken);

            const response = await apiClient.get('/student/lessons/999999/result');

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('LESSON_NOT_FOUND');
        });
    });
});
