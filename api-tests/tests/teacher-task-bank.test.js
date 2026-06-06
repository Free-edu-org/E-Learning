const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Teacher Task Bank API (/api/v1/teacher/task-bank)', () => {
    const uniqueId = Date.now();
    const shortId = String(uniqueId).slice(-6);
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken;
    let teacherToken;
    let secondTeacherToken;
    let secondTeacherPublicId;
    let dedicatedStudentToken;
    let dedicatedStudentPublicId;
    let lessonPublicId;
    let groupPublicId;
    let freeBankTaskPublicId;
    let usedBankTaskPublicId;

    beforeAll(async () => {
        let response = await apiClient.post('/auth/login', adminCreds);
        adminToken = response.data.token;

        response = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = response.data.token;

        setAuthToken(adminToken);
        await apiClient.post('/users/teacher', {
            email: `task.bank.teacher.${uniqueId}@example.com`,
            username: `task_bank_teacher_${uniqueId}`,
            password: 'password123'
        });

        response = await apiClient.post('/auth/login', {
            identifier: `task_bank_teacher_${uniqueId}`,
            password: 'password123'
        });
        secondTeacherToken = response.data.token;

        setAuthToken(secondTeacherToken);
        response = await apiClient.get('/users/me');
        secondTeacherPublicId = response.data.publicId;

        setAuthToken(teacherToken);
        response = await apiClient.post('/user-groups', {
            name: `Task Bank Group ${uniqueId}`,
            description: 'Task bank e2e tests'
        });
        groupPublicId = response.data.publicId;

        setAuthToken(adminToken);
        await apiClient.post('/users/register', {
            email: `task.bank.student.${uniqueId}@example.com`,
            username: `task_bank_student_${uniqueId}`,
            password: 'password123'
        });

        response = await apiClient.post('/auth/login', {
            identifier: `task_bank_student_${uniqueId}`,
            password: 'password123'
        });
        dedicatedStudentToken = response.data.token;

        setAuthToken(dedicatedStudentToken);
        response = await apiClient.get('/users/me');
        dedicatedStudentPublicId = response.data.publicId;

        setAuthToken(teacherToken);
        await apiClient.post(`/user-groups/${groupPublicId}/members/${dedicatedStudentPublicId}`);
        response = await apiClient.post('/lessons', {
            title: `Task Bank Lesson ${shortId}`,
            theme: 'Task bank flow',
            groupPublicIds: [groupPublicId]
        });
        lessonPublicId = response.data.publicId;

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
            task: `Activation task ${shortId}`,
            possibleAnswers: 'yes|no',
            correctAnswers: [0],
            points: 1
        });
        expect(response.status).toBe(201);

        response = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: true });
        expect(response.status).toBe(204);
    });

    afterAll(async () => {
        if (freeBankTaskPublicId) {
            setAuthToken(teacherToken);
            const response = await apiClient.delete(`/teacher/task-bank/tasks/write/${freeBankTaskPublicId}`);
            expect([204, 404, 409]).toContain(response.status);
        }

        if (lessonPublicId) {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/lessons/${lessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (dedicatedStudentPublicId) {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/users/${dedicatedStudentPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (secondTeacherPublicId) {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/users/${secondTeacherPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        if (groupPublicId) {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/${groupPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(null);
    });

    it('should create and update an unused bank task for the owner teacher', async () => {
        setAuthToken(teacherToken);

        let response = await apiClient.post('/teacher/task-bank/tasks/write', {
            task: `Unused bank task ${shortId}`,
            correctAnswers: ['alpha'],
            hint: 'Before use',
            section: 'Bank',
            points: 2
        });

        expect(response.status).toBe(201);
        expect(response.data.publicId).toBeDefined();
        expect(response.data.lessonPublicId).toBeNull();
        freeBankTaskPublicId = response.data.publicId;

        response = await apiClient.put(`/teacher/task-bank/tasks/write/${freeBankTaskPublicId}`, {
            task: `Unused bank task updated ${shortId}`,
            correctAnswers: ['beta'],
            hint: 'Still unused',
            section: 'Bank',
            points: 3
        });

        expect(response.status).toBe(200);
        expect(response.data.task).toBe(`Unused bank task updated ${shortId}`);
        expect(response.data.correctAnswers).toEqual(['beta']);
        expect(response.data.points).toBe(3);
    });

    it('should not expose one teacher bank task to another teacher', async () => {
        setAuthToken(teacherToken);
        let response = await apiClient.get('/teacher/task-bank/tasks');
        expect(response.status).toBe(200);
        const ownerTaskIds = response.data.sections
            .flatMap(section => [
                ...(section.chooseTasks || []),
                ...(section.writeTasks || []),
                ...(section.scatterTasks || []),
                ...(section.speakTasks || [])
            ])
            .map(task => task.publicId);

        expect(ownerTaskIds).toContain(freeBankTaskPublicId);

        setAuthToken(secondTeacherToken);
        response = await apiClient.get('/teacher/task-bank/tasks');
        expect(response.status).toBe(200);
        const foreignTaskIds = response.data.sections
            .flatMap(section => [
                ...(section.chooseTasks || []),
                ...(section.writeTasks || []),
                ...(section.scatterTasks || []),
                ...(section.speakTasks || [])
            ])
            .map(task => task.publicId);

        expect(foreignTaskIds).not.toContain(freeBankTaskPublicId);

        response = await apiClient.put(`/teacher/task-bank/tasks/write/${freeBankTaskPublicId}`, {
            task: 'Hijack attempt',
            correctAnswers: ['x'],
            points: 1
        });
        expect(response.status).toBe(404);
        expect(response.data.code).toBe('TASK_NOT_FOUND');
    });

    it('should lock bank task editing after the task is used in student results', async () => {
        setAuthToken(teacherToken);

        let response = await apiClient.post('/teacher/task-bank/tasks/write', {
            task: `Used bank task ${shortId}`,
            correctAnswers: ['gamma'],
            hint: 'To be assigned',
            section: 'Bank',
            points: 1
        });

        expect(response.status).toBe(201);
        usedBankTaskPublicId = response.data.publicId;

        response = await apiClient.post(`/teacher/task-bank/tasks/write/${usedBankTaskPublicId}/assign`, {
            lessonPublicIds: [lessonPublicId]
        });
        expect(response.status).toBe(204);

        setAuthToken(dedicatedStudentToken);
        response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
        expect(response.status).toBe(200);

        const writeTask = response.data.sections
            .flatMap(section => section.writeTasks || [])
            .find(task => task.publicId === usedBankTaskPublicId);
        expect(writeTask).toBeDefined();

        response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
            answers: [
                {
                    taskPublicId: usedBankTaskPublicId,
                    taskType: 'write',
                    answer: 'gamma'
                }
            ]
        });
        expect(response.status).toBe(200);
        expect(response.data.details[0].isCorrect).toBe(true);

        setAuthToken(teacherToken);
        response = await apiClient.put(`/teacher/task-bank/tasks/write/${usedBankTaskPublicId}`, {
            task: 'Should be locked',
            correctAnswers: ['delta'],
            hint: 'Blocked edit',
            points: 1
        });

        expect(response.status).toBe(409);
        expect(response.data.code).toBe('TASK_EDIT_LOCKED_AFTER_USE');

        response = await apiClient.delete(`/teacher/task-bank/tasks/write/${usedBankTaskPublicId}`);
        expect(response.status).toBe(409);
        expect(response.data.code).toBe('TASK_EDIT_LOCKED_AFTER_USE');
    });
});
