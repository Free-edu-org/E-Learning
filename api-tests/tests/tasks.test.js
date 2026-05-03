const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Tasks API (/api/v1/lessons/{lessonPublicId}/tasks)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };
    const studentCreds = { identifier: 'jan_kowalski', password: 'student1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let secondTeacherToken;
    let secondTeacherPublicId;
    let studentPublicId;
    let lessonPublicId;
    let chooseTaskPublicId;
    let writeTaskPublicId;
    let scatterTaskPublicId;
    let speakTaskPublicId;
    const createdTasks = [];

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', studentCreds);
        studentToken = res.data.token;
        setAuthToken(studentToken);
        res = await apiClient.get('/users/me');
        studentPublicId = res.data.publicId;

        // Create a second teacher
        const secondTeacher = {
            email: `task.teacher.${uniqueId}@example.com`,
            username: `task_teacher_${uniqueId}`,
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

        // Create lesson as teacher
        setAuthToken(teacherToken);
        res = await apiClient.post('/lessons', {
            title: `Task Lesson ${uniqueId}`,
            theme: 'Testing',
            groupPublicIds: []
        });
        lessonPublicId = res.data.publicId;
    });

    afterAll(async () => {
        for (const task of createdTasks.reverse()) {
            setAuthToken(adminToken);
            let response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/${task.type}/${task.publicId}`);
            if (response.status === 403) {
                setAuthToken(teacherToken);
                response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/${task.type}/${task.publicId}`);
            }
            expect([204, 404]).toContain(response.status);
        }

        if (lessonPublicId) {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/lessons/${lessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (secondTeacherPublicId) {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/users/${secondTeacherPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(null);
    });

    // ═══════════════════════════════════════════════
    // Choose Task CRUD
    // ═══════════════════════════════════════════════
    describe('Choose Task CRUD', () => {
        it('should create a choose task (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: 'What is 2+2?',
                possibleAnswers: '3|4|5|6',
                correctAnswer: 1,
                hint: 'Basic math',
                section: 'Math'
            });
            expect(response.status).toBe(201);
            expect(response.data.publicId).toBeDefined();
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data).not.toHaveProperty('id');
            expect(response.data.task).toBe('What is 2+2?');
            expect(response.data.possibleAnswers).toBe('3|4|5|6');
            expect(response.data.correctAnswer).toBe(1);
            chooseTaskPublicId = response.data.publicId;
            createdTasks.push({ type: 'choose', publicId: response.data.publicId });
        });

        it('should update a choose task (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/lessons/${lessonPublicId}/tasks/choose/${chooseTaskPublicId}`, {
                task: 'What is 3+3?',
                possibleAnswers: '5|6|7|8',
                correctAnswer: 1,
                hint: 'Updated hint',
                section: 'Math'
            });
            expect(response.status).toBe(200);
            expect(response.data.task).toBe('What is 3+3?');
            expect(response.data.possibleAnswers).toBe('5|6|7|8');
        });

        it('should return 400 VALIDATION_FAILED for empty task field', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: '',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should return 404 TASK_NOT_FOUND for non-existent task update', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/lessons/${lessonPublicId}/tasks/choose/non-existent-task`, {
                task: 'test',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('TASK_NOT_FOUND');
        });

        it('should return 403 for non-existent lesson when teacher security blocks before lookup', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/non-existent-lesson/tasks/choose`, {
                task: 'test',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            expect(response.status).toBe(403);
        });

        it('should return 404 LESSON_NOT_FOUND for non-existent lesson when admin reaches lookup', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/lessons/non-existent-lesson/tasks/choose`, {
                task: 'test',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('LESSON_NOT_FOUND');
        });

        it('should delete a choose task (204)', async () => {
            setAuthToken(teacherToken);
            // Create a throwaway task to delete
            let res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: 'Deletable task',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            const deletablePublicId = res.data.publicId;

            const response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/choose/${deletablePublicId}`);
            expect(response.status).toBe(204);
        });

        it('should return 404 TASK_NOT_FOUND for deleting non-existent task', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/choose/non-existent-task`);
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('TASK_NOT_FOUND');
        });
    });

    // ═══════════════════════════════════════════════
    // Write Task CRUD
    // ═══════════════════════════════════════════════
    describe('Write Task CRUD', () => {
        it('should create a write task (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'Write the past tense of go',
                correctAnswer: 'went',
                hint: 'Irregular verb',
                section: 'Grammar'
            });
            expect(response.status).toBe(201);
            expect(response.data.publicId).toBeDefined();
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data.task).toBe('Write the past tense of go');
            expect(response.data.correctAnswer).toBe('went');
            writeTaskPublicId = response.data.publicId;
            createdTasks.push({ type: 'write', publicId: response.data.publicId });
        });

        it('should update a write task (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/lessons/${lessonPublicId}/tasks/write/${writeTaskPublicId}`, {
                task: 'Write the past tense of run',
                correctAnswer: 'ran',
                hint: 'Also irregular'
            });
            expect(response.status).toBe(200);
            expect(response.data.correctAnswer).toBe('ran');
        });

        it('should return 400 for missing correctAnswer', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'test',
                correctAnswer: ''
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    // ═══════════════════════════════════════════════
    // Scatter Task CRUD
    // ═══════════════════════════════════════════════
    describe('Scatter Task CRUD', () => {
        it('should create a scatter task (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/scatter`, {
                task: 'Arrange the words',
                words: 'is|cat|the|big',
                correctAnswer: 'the cat is big',
                hint: 'Subject first'
            });
            expect(response.status).toBe(201);
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data.words).toBe('is|cat|the|big');
            expect(response.data.correctAnswer).toBe('the cat is big');
            scatterTaskPublicId = response.data.publicId;
            createdTasks.push({ type: 'scatter', publicId: response.data.publicId });
        });

        it('should update a scatter task (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/lessons/${lessonPublicId}/tasks/scatter/${scatterTaskPublicId}`, {
                task: 'Arrange updated',
                words: 'is|dog|the|small',
                correctAnswer: 'the dog is small'
            });
            expect(response.status).toBe(200);
            expect(response.data.correctAnswer).toBe('the dog is small');
        });

        it('should return 400 for missing words field', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/scatter`, {
                task: 'test',
                words: '',
                correctAnswer: 'test'
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    // ═══════════════════════════════════════════════
    // Speak Task CRUD
    // ═══════════════════════════════════════════════
    describe('Speak Task CRUD', () => {
        it('should create a speak task (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/speak`, {
                task: 'Say hello in English',
                expectedText: 'Hello',
                hint: 'Greeting'
            });
            expect(response.status).toBe(201);
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data.task).toBe('Say hello in English');
            expect(response.data.expectedText).toBe('Hello');
            speakTaskPublicId = response.data.publicId;
            createdTasks.push({ type: 'speak', publicId: response.data.publicId });
        });

        it('should update a speak task (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/lessons/${lessonPublicId}/tasks/speak/${speakTaskPublicId}`, {
                task: 'Say goodbye in English',
                expectedText: 'Goodbye',
                hint: 'Farewell'
            });
            expect(response.status).toBe(200);
            expect(response.data.task).toBe('Say goodbye in English');
            expect(response.data.expectedText).toBe('Goodbye');
        });

        it('should return 400 for empty speak task', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/speak`, {
                task: ''
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    // ═══════════════════════════════════════════════
    // Get Lesson Tasks
    // ═══════════════════════════════════════════════
    describe('Get Lesson Tasks', () => {
        it('should return 200 with tasks for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(200);
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data.sections).toBeDefined();
            expect(Array.isArray(response.data.sections)).toBe(true);
        });

        it('should include correct answers for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(200);
            const sections = response.data.sections;
            const hasChooseTasks = sections.some(s => s.chooseTasks && s.chooseTasks.length > 0);
            if (hasChooseTasks) {
                const section = sections.find(s => s.chooseTasks && s.chooseTasks.length > 0);
                expect(section.chooseTasks[0].correctAnswer).toBeDefined();
                expect(section.chooseTasks[0].correctAnswer).not.toBeNull();
            }
        });

        it('should return 200 for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(200);
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
        });

        it('should return 404 for non-existent lesson', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/lessons/non-existent-lesson/tasks`);
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('LESSON_NOT_FOUND');
        });

        it('should return 401 without token', async () => {
            setAuthToken(null);
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(401);
        });
    });

    // ═══════════════════════════════════════════════
    // Authorization — ownership checks
    // ═══════════════════════════════════════════════
    describe('Task Authorization', () => {
        it('should return 401 for creating task without token', async () => {
            setAuthToken(null);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: 'test',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for STUDENT creating task', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: 'test',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 for non-owner TEACHER creating task', async () => {
            setAuthToken(secondTeacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'Hijack task',
                correctAnswer: 'nope'
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 for non-owner TEACHER updating task', async () => {
            setAuthToken(secondTeacherToken);
            const response = await apiClient.put(`/lessons/${lessonPublicId}/tasks/choose/${chooseTaskPublicId}`, {
                task: 'Tampered',
                possibleAnswers: 'a|b',
                correctAnswer: 0
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 for non-owner TEACHER deleting task', async () => {
            setAuthToken(secondTeacherToken);
            const response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/choose/${chooseTaskPublicId}`);
            expect(response.status).toBe(403);
        });

        it('should allow ADMIN to create task on any lesson (201)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'Admin created task',
                correctAnswer: 'admin'
            });
            expect(response.status).toBe(201);
            expect(response.data.task).toBe('Admin created task');
            createdTasks.push({ type: 'write', publicId: response.data.publicId });
        });
    });

    // ═══════════════════════════════════════════════
    // Reset Progress
    // ═══════════════════════════════════════════════
    describe('Reset User Progress', () => {
        it('should return 204 when teacher resets progress', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
            expect(response.status).toBe(204);
        });

        it('should return 401 without token', async () => {
            setAuthToken(null);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
            expect(response.status).toBe(401);
        });

        it('should return 403 for STUDENT resetting progress', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
            expect(response.status).toBe(403);
        });

        it('should return 403 for non-owner TEACHER resetting progress', async () => {
            setAuthToken(secondTeacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
            expect(response.status).toBe(403);
        });
    });
});
