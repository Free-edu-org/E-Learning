const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Lessons CRUD (/api/v1/lessons)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken;
    let teacherToken;
    let createdLessonPublicId;
    const createdLessonPublicIds = [];
    const lessonTaskIds = new Map();

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;
    });

    afterAll(async () => {
        const tryDeleteLesson = async (lessonPublicIdToDelete, token) => {
            setAuthToken(token);
            const response = await apiClient.delete(`/lessons/${lessonPublicIdToDelete}`);
            return response.status;
        };

        const tryDetachGroups = async (lessonPublicIdToUpdate, token) => {
            setAuthToken(token);
            const listResponse = await apiClient.get('/lessons');
            if (listResponse.status !== 200) {
                return false;
            }

            const lesson = listResponse.data.find((item) => item.publicId === lessonPublicIdToUpdate);
            if (!lesson) {
                return true;
            }

            const updateResponse = await apiClient.put(`/lessons/${lessonPublicIdToUpdate}`, {
                title: lesson.title,
                theme: lesson.theme,
                groupIds: []
            });
            return updateResponse.status === 200;
        };

        for (const lessonPublicId of createdLessonPublicIds.reverse()) {
            const chooseTaskId = lessonTaskIds.get(lessonPublicId);
            if (chooseTaskId) {
                setAuthToken(teacherToken);
                const taskDeleteResponse = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/choose/${chooseTaskId}`);
                expect([204, 404]).toContain(taskDeleteResponse.status);
            }

            let status = await tryDeleteLesson(lessonPublicId, adminToken);
            if ([204, 404].includes(status)) {
                continue;
            }

            status = await tryDeleteLesson(lessonPublicId, teacherToken);
            if ([204, 404].includes(status)) {
                continue;
            }

            await tryDetachGroups(lessonPublicId, adminToken);
            status = await tryDeleteLesson(lessonPublicId, adminToken);
            if ([204, 404].includes(status)) {
                continue;
            }

            await tryDetachGroups(lessonPublicId, teacherToken);
            status = await tryDeleteLesson(lessonPublicId, teacherToken);
            expect([204, 404]).toContain(status);
        }

        setAuthToken(null);
    });

    // ═══════════════════════════════════════════════
    // Create
    // ═══════════════════════════════════════════════
    describe('POST /lessons (Create)', () => {
        it('should create a lesson as TEACHER (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/lessons', {
                title: `CRUD Lesson ${uniqueId}`,
                theme: 'Testing',
                groupIds: []
            });
            expect(response.status).toBe(201);
            expect(response.data.publicId).toBeDefined();
            expect(response.data).not.toHaveProperty('id');
            expect(response.data.title).toBe(`CRUD Lesson ${uniqueId}`);
            expect(response.data.theme).toBe('Testing');
            expect(response.data.isActive).toBe(false); // default
            expect(response.data.teacherId).toBeDefined();
            expect(response.data.teacherName).toBeDefined();
            expect(response.data.teacherAvatarUrl).toBeDefined();
            expect(response.data.createdAt).toBeDefined();
            expect(Array.isArray(response.data.groups)).toBe(true);
            createdLessonPublicId = response.data.publicId;
            createdLessonPublicIds.push(response.data.publicId);
        });

        it('should create a lesson as ADMIN (201)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/lessons', {
                title: `Admin Lesson ${uniqueId}`,
                theme: 'Admin',
                groupIds: []
            });
            expect(response.status).toBe(201);
            expect(response.data.title).toBe(`Admin Lesson ${uniqueId}`);
            expect(response.data).not.toHaveProperty('id');
            createdLessonPublicIds.push(response.data.publicId);
        });

        it('should create a lesson without groupIds (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/lessons', {
                title: `No Group Lesson ${uniqueId}`,
                theme: 'Solo'
            });
            expect(response.status).toBe(201);
            expect(response.data.groups).toEqual([]);
            expect(response.data).not.toHaveProperty('id');
            createdLessonPublicIds.push(response.data.publicId);
        });

        it('should return 400 for missing title', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/lessons', {
                title: '',
                theme: 'Valid'
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should return 400 for missing theme', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/lessons', {
                title: 'Valid',
                theme: ''
            });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    // ═══════════════════════════════════════════════
    // Read
    // ═══════════════════════════════════════════════
    describe('GET /lessons (List)', () => {
        it('should list lessons as TEACHER (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/lessons');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
            const lesson = response.data.find(l => l.publicId === createdLessonPublicId);
            expect(lesson).toBeDefined();
            expect(lesson).toHaveProperty('teacherAvatarUrl');
            expect(lesson).not.toHaveProperty('id');
        });

        it('should list lessons as ADMIN (200)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/lessons');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        it('should filter by search param', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get(`/lessons?search=CRUD Lesson ${uniqueId}`);
            expect(response.status).toBe(200);
            expect(response.data.length).toBeGreaterThanOrEqual(1);
            expect(response.data.every(l => l.title.includes('CRUD Lesson') || l.theme.includes('CRUD Lesson'))).toBe(true);
        });

        it('should filter by status=false', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/lessons?status=false');
            expect(response.status).toBe(200);
            expect(response.data.every(l => l.isActive === false)).toBe(true);
        });

        it('should accept sort parameter without error', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/lessons?sort=title:asc');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });
    });

    // ═══════════════════════════════════════════════
    // Update
    // ═══════════════════════════════════════════════
    describe('PUT /lessons/{id} (Update)', () => {
        it('should update a lesson as owner TEACHER (200)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put(`/lessons/${createdLessonPublicId}`, {
                title: `Updated Lesson ${uniqueId}`,
                theme: 'Updated Theme'
            });
            expect(response.status).toBe(200);
            expect(response.data.publicId).toBe(createdLessonPublicId);
            expect(response.data).not.toHaveProperty('id');
            expect(response.data.title).toBe(`Updated Lesson ${uniqueId}`);
            expect(response.data.theme).toBe('Updated Theme');
        });

        it('should return 403 or 404 for non-existent lesson (PreAuthorize may reject)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put('/lessons/9999999', {
                title: 'Ghost',
                theme: 'Ghost'
            });
            expect(response.status).toBe(403);
        });
    });

    // ═══════════════════════════════════════════════
    // Status Change
    // ═══════════════════════════════════════════════
    describe('PATCH /lessons/{id}/status', () => {
        it('should activate a lesson (204)', async () => {
            setAuthToken(teacherToken);
            const taskResponse = await apiClient.post(`/lessons/${createdLessonPublicId}/tasks/choose`, {
                task: `Activate ${uniqueId}?`,
                possibleAnswers: 'no|yes',
                correctAnswer: 1
            });
            expect(taskResponse.status).toBe(201);
            lessonTaskIds.set(createdLessonPublicId, taskResponse.data.id);

            const response = await apiClient.patch(`/lessons/${createdLessonPublicId}/status`, {
                isActive: true
            });
            expect(response.status).toBe(204);
        });

        it('should verify lesson is now active', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/lessons?status=true');
            expect(response.status).toBe(200);
            const lesson = response.data.find(l => l.publicId === createdLessonPublicId);
            expect(lesson).toBeDefined();
            expect(lesson.isActive).toBe(true);
            expect(lesson).not.toHaveProperty('id');
        });

        it('should deactivate a lesson (204)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.patch(`/lessons/${createdLessonPublicId}/status`, {
                isActive: false
            });
            expect(response.status).toBe(204);
        });

        it('should return 403 or 404 for non-existent lesson', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.patch('/lessons/9999999/status', {
                isActive: true
            });
            expect(response.status).toBe(403);
        });
    });

    // ═══════════════════════════════════════════════
    // Delete
    // ═══════════════════════════════════════════════
    describe('DELETE /lessons/{id}', () => {
        it('should delete a lesson as owner (204)', async () => {
            setAuthToken(teacherToken);
            // Create a disposable lesson
            let res = await apiClient.post('/lessons', {
                title: `Disposable ${uniqueId}`,
                theme: 'Delete me'
            });
            const disposablePublicId = res.data.publicId;

            const response = await apiClient.delete(`/lessons/${disposablePublicId}`);
            expect(response.status).toBe(204);
        });

        it('should return 403 or 404 for deleting non-existent lesson', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.delete('/lessons/9999999');
            expect(response.status).toBe(403);
        });

        it('should return 403 or 404 for deleting already deleted lesson', async () => {
            setAuthToken(teacherToken);
            let res = await apiClient.post('/lessons', {
                title: `Double Delete ${uniqueId}`,
                theme: 'Twice'
            });
            const lessonPublicId = res.data.publicId;
            await apiClient.delete(`/lessons/${lessonPublicId}`);

            const response = await apiClient.delete(`/lessons/${lessonPublicId}`);
            expect(response.status).toBe(403);
        });
    });
});
