const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Submit Lesson API (POST /api/v1/lessons/{lessonPublicId}/submit)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken, teacherToken;
    let studentToken, studentPublicId;
    let student2Token, student2PublicId; // student NOT in group
    let groupPublicId, lessonPublicId;
    let chooseTaskPublicId, writeTaskPublicId, scatterTaskPublicId, speakTaskPublicId;

    // ─── Setup: create fully isolated test data ──────────────────────
    beforeAll(async () => {
        // Login admin & teacher
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        // Teacher creates a group
        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `Submit Group ${uniqueId}`,
            description: 'Group for submit tests'
        });
        expect(res.status).toBe(201);
        groupPublicId = res.data.publicId;

        // Teacher creates a lesson assigned to the group
        res = await apiClient.post('/lessons', {
            title: `Submit Lesson ${uniqueId}`,
            theme: 'Submit Testing',
            groupPublicIds: [groupPublicId]
        });
        expect(res.status).toBe(201);
        lessonPublicId = res.data.publicId;
        expect(res.data).not.toHaveProperty('id');

        // Teacher creates 4 task types
        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
            task: 'What is 2+2?',
            possibleAnswers: '3|4|5|6',
            correctAnswer: 1,
            hint: 'Basic math',
            section: 'Math'
        });
        expect(res.status).toBe(201);
        chooseTaskPublicId = res.data.publicId;

        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
            task: 'Translate "hello" to Polish',
            correctAnswer: 'cześć',
            hint: 'Common greeting',
            section: 'Vocabulary'
        });
        expect(res.status).toBe(201);
        writeTaskPublicId = res.data.publicId;

        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/scatter`, {
            task: 'Arrange the words into a sentence',
            words: 'is|the|big|cat',
            correctAnswer: 'the cat is big',
            hint: 'Subject first',
            section: 'Grammar'
        });
        expect(res.status).toBe(201);
        scatterTaskPublicId = res.data.publicId;

        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/speak`, {
            task: 'Say "Hello, how are you?"',
            expectedText: 'Hello, how are you?',
            hint: 'Focus on pronunciation',
            section: 'Speaking'
        });
        expect(res.status).toBe(201);
        speakTaskPublicId = res.data.publicId;

        res = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: true });
        expect(res.status).toBe(204);

        // Register student1 (will be added to group)
        setAuthToken(adminToken);
        const student1Data = {
            email: `submit.s1.${uniqueId}@test.com`,
            username: `submit_s1_${uniqueId}`,
            password: 'password123'
        };
        res = await apiClient.post('/users/register', student1Data);
        expect(res.status).toBe(201);

        res = await apiClient.post('/auth/login', {
            identifier: student1Data.username,
            password: student1Data.password
        });
        expect(res.status).toBe(200);
        studentToken = res.data.token;

        setAuthToken(studentToken);
        res = await apiClient.get('/users/me');
        studentPublicId = res.data.publicId;

        // Add student1 to group
        setAuthToken(adminToken);
        res = await apiClient.post(`/user-groups/${groupPublicId}/members/${studentPublicId}`);
        expect(res.status).toBe(204);

        // Register student2 (NOT in group — for access-denied tests)
        const student2Data = {
            email: `submit.s2.${uniqueId}@test.com`,
            username: `submit_s2_${uniqueId}`,
            password: 'password123'
        };
        res = await apiClient.post('/users/register', student2Data);
        expect(res.status).toBe(201);

        res = await apiClient.post('/auth/login', {
            identifier: student2Data.username,
            password: student2Data.password
        });
        expect(res.status).toBe(200);
        student2Token = res.data.token;

        setAuthToken(student2Token);
        res = await apiClient.get('/users/me');
        student2PublicId = res.data.publicId;
    });

    // ─── Cleanup ─────────────────────────────────────────────────────
    afterAll(async () => {
        // Reset student progress
        setAuthToken(teacherToken);
        if (lessonPublicId && studentPublicId) {
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        }

        // Delete tasks
        for (const [type, publicId] of [
            ['choose', chooseTaskPublicId],
            ['write', writeTaskPublicId],
            ['scatter', scatterTaskPublicId],
            ['speak', speakTaskPublicId]
        ]) {
            if (publicId) {
                const r = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/${type}/${publicId}`);
                expect([204, 404]).toContain(r.status);
            }
        }

        // Delete lesson
        if (lessonPublicId) {
            const r = await apiClient.delete(`/lessons/${lessonPublicId}`);
            expect([204, 404]).toContain(r.status);
        }

        // Delete group (cascade removes members)
        setAuthToken(adminToken);
        if (groupPublicId) {
            const r = await apiClient.delete(`/user-groups/${groupPublicId}`);
            expect([204, 404]).toContain(r.status);
        }

        // Delete created students
        for (const uid of [studentPublicId, student2PublicId]) {
            if (uid) {
                const r = await apiClient.delete(`/users/${uid}`);
                expect([204, 404]).toContain(r.status);
            }
        }

        setAuthToken(null);
    });

    // Helper: reset progress and re-start lesson for student1
    async function resetAndStartLesson() {
        setAuthToken(teacherToken);
        await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        setAuthToken(studentToken);
        const res = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
        expect(res.status).toBe(200);
        expect(res.data.lessonPublicId).toBe(lessonPublicId);
        expect(res.data).not.toHaveProperty('lessonId');
    }

    function allCorrectAnswers() {
        return [
            { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' },
            { taskPublicId: writeTaskPublicId, taskType: 'write', answer: 'cześć' },
            { taskPublicId: scatterTaskPublicId, taskType: 'scatter', answer: 'the cat is big' },
            { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'Hello, how are you?' }
        ];
    }

    // ═══════════════════════════════════════════════
    // Happy Path
    // ═══════════════════════════════════════════════
    describe('Happy path — all correct answers', () => {
        beforeAll(async () => {
            // Student starts the lesson (creates UserLesson IN_PROGRESS)
            setAuthToken(studentToken);
            const res = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(res.status).toBe(200);
        });

        afterAll(async () => {
            setAuthToken(teacherToken);
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        });

        it('should return 200 with perfect score when all answers are correct', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allCorrectAnswers()
            });
            expect(response.status).toBe(200);
            expect(response.data.score).toBe(4);
            expect(response.data.maxScore).toBe(4);
        });

        it('should return details array matching the number of submitted answers', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allCorrectAnswers()
            });
            expect(response.status).toBe(200);
            expect(response.data.details).toHaveLength(4);
        });

        it('should return correct detail structure for each result item', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allCorrectAnswers()
            });
            expect(response.status).toBe(200);

            for (const detail of response.data.details) {
                expect(detail).toHaveProperty('taskPublicId');
                expect(detail).toHaveProperty('taskType');
                expect(detail).toHaveProperty('isCorrect');
                expect(detail).toHaveProperty('correctAnswer');
                expect(typeof detail.taskPublicId).toBe('string');
                expect(typeof detail.taskType).toBe('string');
                expect(typeof detail.isCorrect).toBe('boolean');
            }
        });
    });

    // ═══════════════════════════════════════════════
    // Scoring logic
    // ═══════════════════════════════════════════════
    describe('Scoring logic', () => {
        beforeEach(async () => {
            await resetAndStartLesson();
        });

        afterAll(async () => {
            setAuthToken(teacherToken);
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        });

        it('should score wrong answers correctly (score < maxScore)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '0' },        // wrong
                    { taskPublicId: writeTaskPublicId, taskType: 'write', answer: 'wrong' },       // wrong
                    { taskPublicId: scatterTaskPublicId, taskType: 'scatter', answer: 'cat big' }, // wrong
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'anything' }     // wrong
                ]
            });
            expect(response.status).toBe(200);
            expect(response.data.score).toBe(0);
            expect(response.data.maxScore).toBe(4);

            const chooseDetail = response.data.details.find(d => d.taskType === 'choose');
            expect(chooseDetail.isCorrect).toBe(false);
            expect(chooseDetail.correctAnswer).toBe('1');

            const writeDetail = response.data.details.find(d => d.taskType === 'write');
            expect(writeDetail.isCorrect).toBe(false);

            const speakDetail = response.data.details.find(d => d.taskType === 'speak');
            expect(speakDetail.isCorrect).toBe(false);
            expect(speakDetail.correctAnswer).toBe('Hello, how are you?');
        });

        it('should be case-insensitive for write tasks', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' },
                    { taskPublicId: writeTaskPublicId, taskType: 'write', answer: 'CZEŚĆ' },
                    { taskPublicId: scatterTaskPublicId, taskType: 'scatter', answer: 'the cat is big' },
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'Hello, how are you?' }
                ]
            });
            expect(response.status).toBe(200);
            const writeDetail = response.data.details.find(d => d.taskType === 'write');
            expect(writeDetail.isCorrect).toBe(true);
        });

        it('should be case-insensitive for scatter tasks', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' },
                    { taskPublicId: writeTaskPublicId, taskType: 'write', answer: 'cześć' },
                    { taskPublicId: scatterTaskPublicId, taskType: 'scatter', answer: 'THE CAT IS BIG' },
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'Hello, how are you?' }
                ]
            });
            expect(response.status).toBe(200);
            const scatterDetail = response.data.details.find(d => d.taskType === 'scatter');
            expect(scatterDetail.isCorrect).toBe(true);
        });

        it('should trim whitespace in write answers', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' },
                    { taskPublicId: writeTaskPublicId, taskType: 'write', answer: '  cześć  ' },
                    { taskPublicId: scatterTaskPublicId, taskType: 'scatter', answer: 'the cat is big' },
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'Hello, how are you?' }
                ]
            });
            expect(response.status).toBe(200);
            const writeDetail = response.data.details.find(d => d.taskType === 'write');
            expect(writeDetail.isCorrect).toBe(true);
        });

        it('should mark speak task as wrong when transcription does not match expected text', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' },
                    { taskPublicId: writeTaskPublicId, taskType: 'write', answer: 'cześć' },
                    { taskPublicId: scatterTaskPublicId, taskType: 'scatter', answer: 'the cat is big' },
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'completely random gibberish 12345' }
                ]
            });
            expect(response.status).toBe(200);
            const speakDetail = response.data.details.find(d => d.taskType === 'speak');
            expect(speakDetail.isCorrect).toBe(false);
            expect(speakDetail.correctAnswer).toBe('Hello, how are you?');
        });

        it('should handle partial submission (fewer answers than total tasks)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' },
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'Hello, how are you?' }
                ]
            });
            expect(response.status).toBe(200);
            expect(response.data.score).toBe(2);
            expect(response.data.maxScore).toBe(2);
            expect(response.data.details).toHaveLength(2);
        });
    });

    // ═══════════════════════════════════════════════
    // Authorization
    // ═══════════════════════════════════════════════
    describe('Authorization', () => {
        it('should return 401 without token', async () => {
            setAuthToken(null);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
            });
            expect(response.status).toBe(401);
        });

        it('should return 403 for TEACHER', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 for ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
            });
            expect(response.status).toBe(403);
        });

        it('should return 403 STUDENT_NO_ACCESS for student not in group', async () => {
            setAuthToken(student2Token);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
            });
            expect(response.status).toBe(403);
            expect(response.data.code).toBe('STUDENT_NO_ACCESS');
        });
    });

    // ═══════════════════════════════════════════════
    // Error scenarios
    // ═══════════════════════════════════════════════
    describe('Error scenarios', () => {
        it('should return 404 LESSON_NOT_FOUND for non-existent lesson', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post('/lessons/9999999/submit', {
                answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('LESSON_NOT_FOUND');
        });

        it('should return 400 LESSON_NOT_STARTED when lesson has not been started', async () => {
            // Reset progress to remove UserLesson record
            setAuthToken(teacherToken);
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);

            // Submit WITHOUT calling GET /tasks first
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('LESSON_NOT_STARTED');
        });

        it('should return 403 LESSON_ALREADY_COMPLETED on double submit', async () => {
            await resetAndStartLesson();

            // First submit
            setAuthToken(studentToken);
            const first = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allCorrectAnswers()
            });
            expect(first.status).toBe(200);

            // Second submit — must be blocked
            const second = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allCorrectAnswers()
            });
            expect(second.status).toBe(403);
            expect(second.data.code).toBe('LESSON_ALREADY_COMPLETED');
        });

        it('should return 400 INVALID_TASK_TYPE for unknown task type', async () => {
            await resetAndStartLesson();

            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'unknown_type', answer: '1' }]
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('INVALID_TASK_TYPE');
        });

        it('should return 404 TASK_NOT_FOUND for non-existent taskId', async () => {
            await resetAndStartLesson();

            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: 'non-existent-task', taskType: 'choose', answer: '1' }]
            });
            expect(response.status).toBe(404);
            expect(response.data.code).toBe('TASK_NOT_FOUND');
        });

        it('should return 403 LESSON_NOT_ACTIVE when student starts or submits an inactive lesson', async () => {
            setAuthToken(teacherToken);
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
            let response = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: false });
            expect(response.status).toBe(204);

            try {
                setAuthToken(studentToken);
                response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
                expect(response.status).toBe(403);
                expect(response.data.code).toBe('LESSON_NOT_ACTIVE');

                response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                    answers: [{ taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' }]
                });
                expect(response.status).toBe(403);
                expect(response.data.code).toBe('LESSON_NOT_ACTIVE');
            } finally {
                setAuthToken(teacherToken);
                response = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: true });
                expect(response.status).toBe(204);
            }
        });
    });

    // ═══════════════════════════════════════════════
    // GET /tasks interaction (student view)
    // ═══════════════════════════════════════════════
    describe('GET /tasks interaction for students', () => {
        afterAll(async () => {
            setAuthToken(teacherToken);
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        });

        it('should set lesson status to IN_PROGRESS on first GET /tasks', async () => {
            await resetAndStartLesson();

            setAuthToken(studentToken);
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(200);
            expect(response.data.lessonPublicId).toBe(lessonPublicId);
            expect(response.data).not.toHaveProperty('lessonId');
            expect(response.data.status).toBe('IN_PROGRESS');
        });

        it('should strip correct answers from student task view', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(200);

            for (const section of response.data.sections) {
                for (const task of (section.chooseTasks || [])) {
                    expect(task.correctAnswer).toBeNull();
                }
                for (const task of (section.writeTasks || [])) {
                    expect(task.correctAnswer).toBeNull();
                }
                for (const task of (section.scatterTasks || [])) {
                    expect(task.correctAnswer).toBeNull();
                }
            }
        });

        it('should return 403 LESSON_ALREADY_COMPLETED when student views completed lesson tasks', async () => {
            // Submit to complete
            setAuthToken(studentToken);
            await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: allCorrectAnswers()
            });

            // GET /tasks should be blocked
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(403);
            expect(response.data.code).toBe('LESSON_ALREADY_COMPLETED');
        });

        it('should return 403 STUDENT_NO_ACCESS for student not in lesson group', async () => {
            setAuthToken(student2Token);
            const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(403);
            expect(response.data.code).toBe('STUDENT_NO_ACCESS');
        });
    });
});
