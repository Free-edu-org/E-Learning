const crypto = require('crypto');
const { apiClient, setAuthToken } = require('../utils/apiClient');
const { createPool } = require('../utils/db');

describe('Submit Lesson API (POST /api/v1/lessons/{lessonPublicId}/submit) - STT flow', () => {
    const uniqueId = Date.now();
    const shortId = String(uniqueId).slice(-6);
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let studentPublicId;
    let studentDbId;
    let outsiderToken;
    let outsiderPublicId;
    let outsiderDbId;
    let groupPublicId;
    let lessonPublicId;
    let lessonDbId;
    let chooseTaskPublicId;
    let writeTaskPublicId;
    let scatterTaskPublicId;
    let speakTaskPublicId;
    let secondSpeakTaskPublicId;
    let speakTaskDbId;
    let secondSpeakTaskDbId;
    let dbPool;
    const insertedAttemptPublicIds = [];

    beforeAll(async () => {
        dbPool = createPool();

        let response = await apiClient.post('/auth/login', adminCreds);
        adminToken = response.data.token;

        response = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = response.data.token;

        setAuthToken(teacherToken);
        response = await apiClient.post('/user-groups', {
            name: `Submit STT Group ${uniqueId}`,
            description: 'Group for speaking submit tests'
        });
        expect(response.status).toBe(201);
        groupPublicId = response.data.publicId;

        response = await apiClient.post('/lessons', {
            title: `Submit STT Lesson ${shortId}`,
            theme: 'Speaking',
            groupPublicIds: [groupPublicId]
        });
        expect(response.status).toBe(201);
        lessonPublicId = response.data.publicId;

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
            task: 'What is 2+2?',
            possibleAnswers: '3|4|5|6',
            correctAnswer: 1
        });
        chooseTaskPublicId = response.data.publicId;

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/write`, {
            task: 'Translate hello',
            correctAnswer: 'hello'
        });
        writeTaskPublicId = response.data.publicId;

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/scatter`, {
            task: 'Arrange',
            words: 'cat|the|big|is',
            correctAnswer: 'the cat is big'
        });
        scatterTaskPublicId = response.data.publicId;

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/speak`, {
            expectedText: 'Hello how are you'
        });
        speakTaskPublicId = response.data.publicId;

        response = await apiClient.post(`/lessons/${lessonPublicId}/tasks/speak`, {
            expectedText: 'Good morning'
        });
        secondSpeakTaskPublicId = response.data.publicId;

        response = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: true });
        expect(response.status).toBe(204);

        setAuthToken(adminToken);
        response = await apiClient.post('/users/register', {
            email: `submit.stt.student.${uniqueId}@test.com`,
            username: `submit_stt_student_${uniqueId}`,
            password: 'password123'
        });
        expect(response.status).toBe(201);
        response = await apiClient.post('/auth/login', {
            identifier: `submit_stt_student_${uniqueId}`,
            password: 'password123'
        });
        studentToken = response.data.token;
        setAuthToken(studentToken);
        response = await apiClient.get('/users/me');
        studentPublicId = response.data.publicId;

        setAuthToken(adminToken);
        response = await apiClient.post(`/user-groups/${groupPublicId}/members/${studentPublicId}`);
        expect(response.status).toBe(204);

        response = await apiClient.post('/users/register', {
            email: `submit.stt.outsider.${uniqueId}@test.com`,
            username: `submit_stt_outsider_${uniqueId}`,
            password: 'password123'
        });
        expect(response.status).toBe(201);
        response = await apiClient.post('/auth/login', {
            identifier: `submit_stt_outsider_${uniqueId}`,
            password: 'password123'
        });
        outsiderToken = response.data.token;
        setAuthToken(outsiderToken);
        response = await apiClient.get('/users/me');
        outsiderPublicId = response.data.publicId;

        lessonDbId = await fetchId('SELECT id FROM lessons WHERE public_id = ?', [lessonPublicId]);
        studentDbId = await fetchId('SELECT id FROM users WHERE public_id = ?', [studentPublicId]);
        outsiderDbId = await fetchId('SELECT id FROM users WHERE public_id = ?', [outsiderPublicId]);
        speakTaskDbId = await fetchId('SELECT id FROM speak_tasks WHERE public_id = ?', [speakTaskPublicId]);
        secondSpeakTaskDbId = await fetchId('SELECT id FROM speak_tasks WHERE public_id = ?', [secondSpeakTaskPublicId]);
    });

    afterAll(async () => {
        if (dbPool && insertedAttemptPublicIds.length > 0) {
            const placeholders = insertedAttemptPublicIds.map(() => '?').join(', ');
            await dbPool.execute(`DELETE FROM speak_attempts WHERE public_id IN (${placeholders})`, insertedAttemptPublicIds);
        }

        setAuthToken(teacherToken);
        if (lessonPublicId && studentPublicId) {
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        }

        for (const [type, publicId] of [
            ['choose', chooseTaskPublicId],
            ['write', writeTaskPublicId],
            ['scatter', scatterTaskPublicId],
            ['speak', speakTaskPublicId],
            ['speak', secondSpeakTaskPublicId]
        ]) {
            if (publicId) {
                const response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/${type}/${publicId}`);
                expect([204, 404]).toContain(response.status);
            }
        }

        if (lessonPublicId) {
            const response = await apiClient.delete(`/lessons/${lessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(adminToken);
        if (groupPublicId) {
            const response = await apiClient.delete(`/user-groups/${groupPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        for (const publicId of [studentPublicId, outsiderPublicId]) {
            if (publicId) {
                const response = await apiClient.delete(`/users/${publicId}`);
                expect([204, 404]).toContain(response.status);
            }
        }

        if (dbPool) {
            await dbPool.end();
        }
        setAuthToken(null);
    });

    async function fetchId(sql, params) {
        const [rows] = await dbPool.execute(sql, params);
        return rows[0].id;
    }

    async function currentUserLessonId(userId = studentDbId) {
        const [rows] = await dbPool.execute(
            'SELECT id FROM user_lessons WHERE user_id = ? AND lesson_id = ? ORDER BY id DESC LIMIT 1',
            [userId, lessonDbId]
        );
        return rows[0]?.id ?? null;
    }

    async function resetAndStartLesson() {
        setAuthToken(teacherToken);
        await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);
        setAuthToken(studentToken);
        const response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
        expect(response.status).toBe(200);
    }

    async function insertSpeakAttempt({
        userId = studentDbId,
        taskId = speakTaskDbId,
        userLessonId,
        lessonId = lessonDbId,
        expectedText = 'Hello how are you',
        rawTranscription = 'Hello how are you',
        matchedTranscription = 'hello how are you',
        normalizedExpected = 'hello how are you',
        normalizedActual = 'hello how are you',
        score = 1.0,
        correct = true,
        submittedAt = null
    }) {
        const publicId = crypto.randomUUID();
        insertedAttemptPublicIds.push(publicId);
        await dbPool.execute(
            `INSERT INTO speak_attempts
                (public_id, user_id, lesson_id, task_id, user_lesson_id, expected_text,
                 raw_transcription, matched_transcription, normalized_expected, normalized_actual,
                 score, is_correct, words_json, language, duration, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                publicId,
                userId,
                lessonId,
                taskId,
                userLessonId,
                expectedText,
                rawTranscription,
                matchedTranscription,
                normalizedExpected,
                normalizedActual,
                score,
                correct,
                JSON.stringify([
                    { expected: 'hello', actual: 'hello', correct: true }
                ]),
                'en',
                1.3,
                submittedAt
            ]
        );
        return publicId;
    }

    function buildBaseAnswers() {
        return [
            { taskPublicId: chooseTaskPublicId, taskType: 'choose', answer: '1' },
            { taskPublicId: writeTaskPublicId, taskType: 'write', answer: 'hello' },
            { taskPublicId: scatterTaskPublicId, taskType: 'scatter', answer: 'the cat is big' }
        ];
    }

    describe('Happy path with stored SpeakAttempt', () => {
        it('should submit lesson using attemptId and ignore FE as source of truth', async () => {
            await resetAndStartLesson();
            const userLessonId = await currentUserLessonId();
            const attemptId = await insertSpeakAttempt({ userLessonId, correct: true, score: 1.0 });

            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    ...buildBaseAnswers(),
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'spoofed text', attemptId }
                ]
            });

            expect(response.status).toBe(200);
            expect(response.data.score).toBe(4);
            expect(response.data.maxScore).toBe(4);
            expect(response.data.details.find((detail) => detail.taskType === 'speak').isCorrect).toBe(true);
        });
    });

    describe('Skipped speaking task', () => {
        it('should allow submit when speaking task is sent without attemptId and mark it incorrect', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    ...buildBaseAnswers(),
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '' }
                ]
            });

            expect(response.status).toBe(200);
            expect(response.data.score).toBe(3);
            expect(response.data.maxScore).toBe(4);
            expect(response.data.details.find((detail) => detail.taskType === 'speak').isCorrect).toBe(false);
        });

        it('should not trust plain speaking answer without attemptId', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    ...buildBaseAnswers(),
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: 'Hello how are you' }
                ]
            });

            expect(response.status).toBe(200);
            expect(response.data.details.find((detail) => detail.taskType === 'speak').isCorrect).toBe(false);
        });
    });

    describe('Invalid attemptId scenarios', () => {
        it('should return 404 when attemptId does not exist', async () => {
            await resetAndStartLesson();
            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '', attemptId: crypto.randomUUID() }
                ]
            });

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('SPEAK_ATTEMPT_NOT_FOUND');
        });

        it('should reject attempt from another user', async () => {
            await resetAndStartLesson();
            const userLessonId = await currentUserLessonId(outsiderDbId) || await createManualUserLesson(outsiderDbId);
            const attemptId = await insertSpeakAttempt({ userId: outsiderDbId, userLessonId });

            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '', attemptId }]
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('SPEAK_ATTEMPT_INVALID');
        });

        it('should reject attempt from another speaking task', async () => {
            await resetAndStartLesson();
            const userLessonId = await currentUserLessonId();
            const attemptId = await insertSpeakAttempt({
                userLessonId,
                taskId: secondSpeakTaskDbId,
                expectedText: 'Good morning',
                rawTranscription: 'Good morning',
                matchedTranscription: 'good morning',
                normalizedExpected: 'good morning',
                normalizedActual: 'good morning'
            });

            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '', attemptId }]
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('SPEAK_ATTEMPT_INVALID');
        });
    });

    describe('Reset and UserLesson isolation', () => {
        it('should reject old attempt after reset and new lesson run', async () => {
            await resetAndStartLesson();
            const oldUserLessonId = await currentUserLessonId();
            const attemptId = await insertSpeakAttempt({ userLessonId: oldUserLessonId });

            setAuthToken(teacherToken);
            await apiClient.post(`/lessons/${lessonPublicId}/users/${studentPublicId}/reset`);

            setAuthToken(studentToken);
            let response = await apiClient.get(`/lessons/${lessonPublicId}/tasks`);
            expect(response.status).toBe(200);

            response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '', attemptId }]
            });

            expect([400, 404]).toContain(response.status);
            expect(['SPEAK_ATTEMPT_INVALID', 'SPEAK_ATTEMPT_NOT_FOUND']).toContain(response.data.code);
        });
    });

    describe('Multiple speaking tasks and limit per task', () => {
        it('should treat attempt validation independently per task', async () => {
            await resetAndStartLesson();
            const userLessonId = await currentUserLessonId();
            const firstAttemptId = await insertSpeakAttempt({ userLessonId, taskId: speakTaskDbId });
            const secondAttemptId = await insertSpeakAttempt({
                userLessonId,
                taskId: secondSpeakTaskDbId,
                expectedText: 'Good morning',
                rawTranscription: 'Good morning',
                matchedTranscription: 'good morning',
                normalizedExpected: 'good morning',
                normalizedActual: 'good morning'
            });

            setAuthToken(studentToken);
            const response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '', attemptId: firstAttemptId },
                    { taskPublicId: secondSpeakTaskPublicId, taskType: 'speak', answer: '', attemptId: secondAttemptId }
                ]
            });

            expect(response.status).toBe(200);
            expect(response.data.details).toHaveLength(2);
            expect(response.data.details.every((detail) => detail.isCorrect)).toBe(true);
        });
    });

    describe('Completed lesson', () => {
        it('should block second submit after lesson completion', async () => {
            await resetAndStartLesson();
            const userLessonId = await currentUserLessonId();
            const attemptId = await insertSpeakAttempt({ userLessonId });

            setAuthToken(studentToken);
            let response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [
                    ...buildBaseAnswers(),
                    { taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '', attemptId }
                ]
            });
            expect(response.status).toBe(200);

            response = await apiClient.post(`/lessons/${lessonPublicId}/submit`, {
                answers: [{ taskPublicId: speakTaskPublicId, taskType: 'speak', answer: '', attemptId }]
            });
            expect(response.status).toBe(403);
            expect(response.data.code).toBe('LESSON_ALREADY_COMPLETED');
        });
    });

    async function createManualUserLesson(userId) {
        await dbPool.execute(
            'INSERT INTO user_lessons (user_id, lesson_id, status, score, max_score) VALUES (?, ?, ?, ?, ?)',
            [userId, lessonDbId, 'IN_PROGRESS', 0, 0]
        );
        return currentUserLessonId(userId);
    }
});
