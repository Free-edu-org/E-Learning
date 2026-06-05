const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Multiple Correct Answers (EL-152)', () => {
    const uniqueId = Date.now();
    const shortId = String(uniqueId).slice(-6);
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken, teacherToken, studentToken;
    let studentPublicId, groupPublicId, lessonPublicId;
    let chooseTaskId, writeTaskId, scatterTaskId;
    const createdTasks = [];

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `MultiAns Group ${uniqueId}`,
            description: 'Multiple answers tests'
        });
        expect(res.status).toBe(201);
        groupPublicId = res.data.publicId;

        res = await apiClient.post('/lessons', {
            title: `MultiAns Lesson ${shortId}`,
            theme: 'Languages',
            groupPublicIds: [groupPublicId]
        });
        expect(res.status).toBe(201);
        lessonPublicId = res.data.publicId;

        // choose: correctAnswers [1, 3] → Paris (idx 1) and Madrid (idx 3)
        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
            task: 'Capital of France?',
            possibleAnswers: 'London|Paris|Berlin|Madrid',
            correctAnswers: [1, 3]
        });
        expect(res.status).toBe(201);
        chooseTaskId = res.data.publicId;
        createdTasks.push({ type: 'choose', publicId: chooseTaskId });

        // write: correctAnswers ['hello', 'good morning']
        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
            task: 'Translate "bonjour"',
            correctAnswers: ['hello', 'good morning']
        });
        expect(res.status).toBe(201);
        writeTaskId = res.data.publicId;
        createdTasks.push({ type: 'write', publicId: writeTaskId });

        // scatter: correctAnswers ['the cat is big', 'the big cat is']
        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/scatter`, {
            task: 'Arrange the words',
            words: 'cat|the|big|is',
            correctAnswers: ['the cat is big', 'the big cat is']
        });
        expect(res.status).toBe(201);
        scatterTaskId = res.data.publicId;
        createdTasks.push({ type: 'scatter', publicId: scatterTaskId });

        res = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: true });
        expect(res.status).toBe(204);

        setAuthToken(adminToken);
        await apiClient.post('/users/register', {
            email: `multi.ans.s.${uniqueId}@test.com`,
            username: `multi_ans_s_${uniqueId}`,
            password: 'password123'
        });
        res = await apiClient.post('/auth/login', {
            identifier: `multi_ans_s_${uniqueId}`,
            password: 'password123'
        });
        studentToken = res.data.token;
        setAuthToken(studentToken);
        res = await apiClient.get('/users/me');
        studentPublicId = res.data.publicId;

        setAuthToken(teacherToken);
        await apiClient.post(`/user-groups/${groupPublicId}/members/${studentPublicId}`);
    });

    afterAll(async () => {
        setAuthToken(teacherToken);
        if (lessonPublicId && studentPublicId) {
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        }
        for (const task of [...createdTasks].reverse()) {
            const res = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/${task.type}/${task.publicId}`);
            expect([204, 404]).toContain(res.status);
        }
        setAuthToken(adminToken);
        if (lessonPublicId) await apiClient.delete(`/lessons/${lessonPublicId}`);
        if (groupPublicId) await apiClient.delete(`/user-groups/${groupPublicId}`);
        if (studentPublicId) await apiClient.delete(`/users/${studentPublicId}`);
        setAuthToken(null);
    });

    async function resetAndStartLesson() {
        setAuthToken(teacherToken);
        await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        setAuthToken(studentToken);
        const res = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
        expect(res.status).toBe(200);
    }

    function allAnswers({ choose = '1', write = 'hello', scatter = 'the cat is big' } = {}) {
        return [
            { taskPublicId: chooseTaskId, taskType: 'choose', answer: choose },
            { taskPublicId: writeTaskId, taskType: 'write', answer: write },
            { taskPublicId: scatterTaskId, taskType: 'scatter', answer: scatter }
        ];
    }

    // ════════════════════════════════════════════════════════
    // CRUD — correctAnswers field in response
    // ════════════════════════════════════════════════════════
    describe('CRUD — correctAnswers in response', () => {
        it('GET /tasks returns correctAnswers list for choose task', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(res.status).toBe(200);
            const task = res.data.sections
                .flatMap(s => s.chooseTasks || [])
                .find(t => t.publicId === chooseTaskId);
            expect(task).toBeDefined();
            expect(task.correctAnswers).toEqual([1, 3]);
        });

        it('GET /tasks returns correctAnswers list for write task', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            const task = res.data.sections
                .flatMap(s => s.writeTasks || [])
                .find(t => t.publicId === writeTaskId);
            expect(task).toBeDefined();
            expect(task.correctAnswers).toEqual(['hello', 'good morning']);
        });

        it('GET /tasks returns correctAnswers list for scatter task', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            const task = res.data.sections
                .flatMap(s => s.scatterTasks || [])
                .find(t => t.publicId === scatterTaskId);
            expect(task).toBeDefined();
            expect(task.correctAnswers).toEqual(['the cat is big', 'the big cat is']);
        });

        it('updating choose task replaces correctAnswers list', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.put(`/lessons/${lessonPublicId}/tasks/choose/${chooseTaskId}`, {
                task: 'Capital of France?',
                possibleAnswers: 'London|Paris|Berlin|Madrid',
                correctAnswers: [1, 3]
            });
            expect(res.status).toBe(200);
            expect(res.data.correctAnswers).toEqual([1, 3]);
        });

        it('creating choose task with only correctAnswer stores single-element correctAnswers', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: 'Single answer choose',
                possibleAnswers: 'a|b|c',
                correctAnswers: [0]
            });
            expect(res.status).toBe(201);
            expect(res.data.correctAnswers).toEqual([0]);
            createdTasks.push({ type: 'choose', publicId: res.data.publicId });
        });

        it('creating write task with only correctAnswer stores single-element correctAnswers', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'Single answer write',
                correctAnswers: ['solo']
            });
            expect(res.status).toBe(201);
            expect(res.data.correctAnswers).toEqual(['solo']);
            createdTasks.push({ type: 'write', publicId: res.data.publicId });
        });

        it('creating scatter task with only correctAnswer stores single-element correctAnswers', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/scatter`, {
                task: 'Single answer scatter',
                words: 'a|b',
                correctAnswers: ['a b']
            });
            expect(res.status).toBe(201);
            expect(res.data.correctAnswers).toEqual(['a b']);
            createdTasks.push({ type: 'scatter', publicId: res.data.publicId });
        });

        it('returns 400 INVALID_TASK_ANSWERS for duplicate indices in correctAnswers', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: 'Dedup choose test',
                possibleAnswers: 'x|y|z',
                correctAnswers: [0, 1, 0, 1]
            });
            expect(res.status).toBe(400);
            expect(res.data.code).toBe('INVALID_TASK_ANSWERS');
        });

        it('returns 400 INVALID_TASK_ANSWERS for duplicate text answers (case-insensitive)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'Dedup write test',
                correctAnswers: ['hello', 'HELLO', 'world']
            });
            expect(res.status).toBe(400);
            expect(res.data.code).toBe('INVALID_TASK_ANSWERS');
        });

        it('speak task creates with single expectedText', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/speak`, {
                expectedText: 'Good morning'
            });
            expect(res.status).toBe(201);
            expect(res.data.expectedText).toBe('Good morning');
            createdTasks.push({ type: 'speak', publicId: res.data.publicId });
        });
    });

    // ════════════════════════════════════════════════════════
    // CRUD — validation
    // ════════════════════════════════════════════════════════
    describe('CRUD — validation', () => {
        it('returns 400 INVALID_TASK_ANSWERS for out-of-bounds index in correctAnswers', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
                task: 'Bad index test',
                possibleAnswers: 'a|b|c',
                correctAnswers: [0, 99]
            });
            expect(res.status).toBe(400);
            expect(res.data.code).toBe('INVALID_TASK_ANSWERS');
        });

        it('returns 400 INVALID_TASK_ANSWERS for empty string in write correctAnswers', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'Empty answer test',
                correctAnswers: ['valid', '']
            });
            expect(res.status).toBe(400);
            expect(res.data.code).toBe('INVALID_TASK_ANSWERS');
        });

        it('returns 400 INVALID_TASK_ANSWERS for text exceeding 300 chars in correctAnswers', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
                task: 'Long answer test',
                correctAnswers: ['normal', 'a'.repeat(301)]
            });
            expect(res.status).toBe(400);
            expect(res.data.code).toBe('INVALID_TASK_ANSWERS');
        });

        it('returns 400 INVALID_TASK_ANSWERS for speak task with empty expectedText', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/speak`, {
                expectedText: ''
            });
            expect(res.status).toBe(400);
            expect(res.data.code).toBe('INVALID_TASK_ANSWERS');
        });
    });

    // ════════════════════════════════════════════════════════
    // Submit — choose task matching
    // ════════════════════════════════════════════════════════
    describe('Submit — choose task', () => {
        it('first correct answer (index 1 = Paris) is marked correct', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '1' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === chooseTaskId).isCorrect).toBe(true);
        });

        it('second correct answer (index 3 = Madrid) is marked correct', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '3' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === chooseTaskId).isCorrect).toBe(true);
        });

        it('wrong answer (index 0 = London) is marked incorrect', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '0' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === chooseTaskId).isCorrect).toBe(false);
        });

        it('submit response includes full correctAnswers list for choose task', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '1' })
            });
            expect(res.status).toBe(200);
            const detail = res.data.details.find(d => d.taskPublicId === chooseTaskId);
            expect(detail.correctAnswers).toBeDefined();
            expect(detail.correctAnswers).toContain('1');
            expect(detail.correctAnswers).toContain('3');
            expect(detail.correctAnswers).toHaveLength(2);
        });
    });

    // ════════════════════════════════════════════════════════
    // Submit — write task matching
    // ════════════════════════════════════════════════════════
    describe('Submit — write task', () => {
        it('first correct answer ("hello") is marked correct', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ write: 'hello' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === writeTaskId).isCorrect).toBe(true);
        });

        it('second correct answer ("good morning") is marked correct', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ write: 'good morning' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === writeTaskId).isCorrect).toBe(true);
        });

        it('matching is case-insensitive ("HELLO" matches "hello")', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ write: 'HELLO' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === writeTaskId).isCorrect).toBe(true);
        });

        it('case-insensitive match for second correct answer ("GOOD MORNING")', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ write: 'GOOD MORNING' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === writeTaskId).isCorrect).toBe(true);
        });

        it('wrong answer ("bonjour") is marked incorrect', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ write: 'bonjour' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === writeTaskId).isCorrect).toBe(false);
        });

        it('submit response includes full correctAnswers list for write task', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers()
            });
            expect(res.status).toBe(200);
            const detail = res.data.details.find(d => d.taskPublicId === writeTaskId);
            expect(detail.correctAnswers).toBeDefined();
            expect(detail.correctAnswers).toContain('hello');
            expect(detail.correctAnswers).toContain('good morning');
            expect(detail.correctAnswers).toHaveLength(2);
        });
    });

    // ════════════════════════════════════════════════════════
    // Submit — scatter task matching
    // ════════════════════════════════════════════════════════
    describe('Submit — scatter task', () => {
        it('first correct word order ("the cat is big") is marked correct', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ scatter: 'the cat is big' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === scatterTaskId).isCorrect).toBe(true);
        });

        it('second correct word order ("the big cat is") is marked correct', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ scatter: 'the big cat is' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === scatterTaskId).isCorrect).toBe(true);
        });

        it('wrong word order ("big is the cat") is marked incorrect', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ scatter: 'big is the cat' })
            });
            expect(res.status).toBe(200);
            expect(res.data.details.find(d => d.taskPublicId === scatterTaskId).isCorrect).toBe(false);
        });

        it('submit response includes full correctAnswers list for scatter task', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers()
            });
            expect(res.status).toBe(200);
            const detail = res.data.details.find(d => d.taskPublicId === scatterTaskId);
            expect(detail.correctAnswers).toBeDefined();
            expect(detail.correctAnswers).toContain('the cat is big');
            expect(detail.correctAnswers).toContain('the big cat is');
            expect(detail.correctAnswers).toHaveLength(2);
        });
    });

    // ════════════════════════════════════════════════════════
    // Submit — score calculation
    // ════════════════════════════════════════════════════════
    describe('Submit — score calculation', () => {
        it('all tasks answered via alternative (second) correct answers yield full score', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '3', write: 'good morning', scatter: 'the big cat is' })
            });
            expect(res.status).toBe(200);
            expect(res.data.score).toBe(res.data.maxScore);
            expect(res.data.maxScore).toBe(3);
        });

        it('all tasks answered with wrong answers yield score 0', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '0', write: 'bonjour', scatter: 'big is cat the' })
            });
            expect(res.status).toBe(200);
            expect(res.data.score).toBe(0);
            expect(res.data.maxScore).toBe(3);
        });

        it('partial correct answers yield partial score', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '1', write: 'wrong', scatter: 'wrong order' })
            });
            expect(res.status).toBe(200);
            expect(res.data.score).toBe(1);
            expect(res.data.maxScore).toBe(3);
        });

        it('mixing first and second correct answers across tasks yields full score', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const res = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allAnswers({ choose: '3', write: 'hello', scatter: 'the big cat is' })
            });
            expect(res.status).toBe(200);
            expect(res.data.score).toBe(3);
            expect(res.data.maxScore).toBe(3);
        });
    });
});
