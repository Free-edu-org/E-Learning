const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Lessons CRUD (/api/v1/lessons)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken;
    let teacherToken;
    let createdLessonId;
    let groupId;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        // Create a group for assignment tests
        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `Lesson CRUD Group ${uniqueId}`,
            description: 'For lesson CRUD tests'
        });
        groupId = res.data.id;
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
                groupIds: [groupId]
            });
            expect(response.status).toBe(201);
            expect(response.data.id).toBeDefined();
            expect(response.data.title).toBe(`CRUD Lesson ${uniqueId}`);
            expect(response.data.theme).toBe('Testing');
            expect(response.data.isActive).toBe(false); // default
            expect(response.data.teacherId).toBeDefined();
            expect(response.data.teacherName).toBeDefined();
            expect(response.data.createdAt).toBeDefined();
            expect(Array.isArray(response.data.groups)).toBe(true);
            createdLessonId = response.data.id;
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
        });

        it('should create a lesson without groupIds (201)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.post('/lessons', {
                title: `No Group Lesson ${uniqueId}`,
                theme: 'Solo'
            });
            expect(response.status).toBe(201);
            expect(response.data.groups).toEqual([]);
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
            const lesson = response.data.find(l => l.id === createdLessonId);
            expect(lesson).toBeDefined();
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
            const response = await apiClient.put(`/lessons/${createdLessonId}`, {
                title: `Updated Lesson ${uniqueId}`,
                theme: 'Updated Theme'
            });
            expect(response.status).toBe(200);
            expect(response.data.title).toBe(`Updated Lesson ${uniqueId}`);
            expect(response.data.theme).toBe('Updated Theme');
        });

        it('should return 403 or 404 for non-existent lesson (PreAuthorize may reject)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.put('/lessons/9999999', {
                title: 'Ghost',
                theme: 'Ghost'
            });
            expect([403, 404]).toContain(response.status);
        });
    });

    // ═══════════════════════════════════════════════
    // Status Change
    // ═══════════════════════════════════════════════
    describe('PATCH /lessons/{id}/status', () => {
        it('should activate a lesson (204)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.patch(`/lessons/${createdLessonId}/status`, {
                isActive: true
            });
            expect(response.status).toBe(204);
        });

        it('should verify lesson is now active', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.get('/lessons?status=true');
            expect(response.status).toBe(200);
            const lesson = response.data.find(l => l.id === createdLessonId);
            expect(lesson).toBeDefined();
            expect(lesson.isActive).toBe(true);
        });

        it('should deactivate a lesson (204)', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.patch(`/lessons/${createdLessonId}/status`, {
                isActive: false
            });
            expect(response.status).toBe(204);
        });

        it('should return 403 or 404 for non-existent lesson', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.patch('/lessons/9999999/status', {
                isActive: true
            });
            expect([403, 404]).toContain(response.status);
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
            const disposableId = res.data.id;

            const response = await apiClient.delete(`/lessons/${disposableId}`);
            expect(response.status).toBe(204);
        });

        it('should return 403 or 404 for deleting non-existent lesson', async () => {
            setAuthToken(teacherToken);
            const response = await apiClient.delete('/lessons/9999999');
            expect([403, 404]).toContain(response.status);
        });

        it('should return 403 or 404 for deleting already deleted lesson', async () => {
            setAuthToken(teacherToken);
            let res = await apiClient.post('/lessons', {
                title: `Double Delete ${uniqueId}`,
                theme: 'Twice'
            });
            const id = res.data.id;
            await apiClient.delete(`/lessons/${id}`);

            const response = await apiClient.delete(`/lessons/${id}`);
            expect([403, 404]).toContain(response.status);
        });
    });
});
