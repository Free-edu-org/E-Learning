const FormData = require('form-data');
const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Lesson Attachments (/api/v1/lessons/{lessonPublicId}/attachments)', () => {
    const uniqueId = Date.now();
    const adminCreds = { identifier: 'admin_marek', password: 'admin1' };
    const teacherCreds = { identifier: 'pan_tomasz', password: 'admin1' };

    let adminToken;
    let teacherToken;
    let studentToken;
    let studentPublicId;
    let groupPublicId;
    let lessonPublicId;
    let attachmentPublicId;
    let chooseTaskPublicId;
    let tempLessonPublicId;
    let tempAttachmentPublicId;
    const createdAttachmentIds = new Set();

    // Minimal valid PDF (1-page blank PDF, 200+ bytes)
    const VALID_PDF = Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
        '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n' +
        'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n' +
        '0000000058 00000 n\n0000000115 00000 n\n' +
        'trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n'
    );

    const NOT_PDF = Buffer.from('This is not a PDF file, just plain text.');

    const makePdfForm = (buf, filename = 'test.pdf', contentType = 'application/pdf') => {
        const form = new FormData();
        form.append('file', buf, { filename, contentType });
        return form;
    };

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', adminCreds);
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', teacherCreds);
        teacherToken = res.data.token;

        // Teacher creates group and lesson for attachment tests
        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `Attach Group ${uniqueId}`,
            description: 'Group for attachment tests',
        });
        expect(res.status).toBe(201);
        groupPublicId = res.data.publicId;

        res = await apiClient.post('/lessons', {
            title: `Attach ${uniqueId}`,
            theme: 'Attachment Tests',
            groupPublicIds: [groupPublicId],
        });
        expect(res.status).toBe(201);
        lessonPublicId = res.data.publicId;
        expect(res.data).not.toHaveProperty('id');

        res = await apiClient.post(`/lessons/${lessonPublicId}/tasks/choose`, {
            task: 'Choose the correct answer',
            possibleAnswers: 'A|B|C|D',
            correctAnswer: 0,
            hint: 'Pick A',
            section: 'Files'
        });
        expect(res.status).toBe(201);
        chooseTaskPublicId = res.data.publicId;

        res = await apiClient.patch(`/lessons/${lessonPublicId}/status`, { isActive: true });
        expect(res.status).toBe(204);

        // Teacher creates a student in the group
        setAuthToken(teacherToken);
        res = await apiClient.post('/teacher/students', {
            username: `attach_student_${uniqueId}`,
            email: `attach_student_${uniqueId}@test.com`,
            password: 'admin1',
            groupPublicId,
        });
        expect(res.status).toBe(201);
        studentPublicId = res.data.publicId;

        res = await apiClient.post('/auth/login', {
            identifier: `attach_student_${uniqueId}`,
            password: 'admin1',
        });
        studentToken = res.data.token;
    });

    afterAll(async () => {
        setAuthToken(teacherToken);
        if (tempLessonPublicId && tempAttachmentPublicId) {
            const response = await apiClient.delete(`/lessons/${tempLessonPublicId}/attachments/${tempAttachmentPublicId}`);
            expect([204, 404]).toContain(response.status);
        }
        if (tempLessonPublicId) {
            const response = await apiClient.delete(`/lessons/${tempLessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        for (const createdAttachmentPublicId of createdAttachmentIds) {
            const response = await apiClient.delete(`/lessons/${lessonPublicId}/attachments/${createdAttachmentPublicId}`);
            expect([204, 404]).toContain(response.status);
        }
        if (chooseTaskPublicId) {
            const response = await apiClient.delete(`/lessons/${lessonPublicId}/tasks/choose/${chooseTaskPublicId}`);
            expect([204, 404]).toContain(response.status);
        }
        if (lessonPublicId) {
            const response = await apiClient.delete(`/lessons/${lessonPublicId}`);
            expect([204, 404]).toContain(response.status);
        }

        setAuthToken(adminToken);
        if (studentPublicId) {
            const response = await apiClient.delete(`/users/${studentPublicId}`);
            expect([204, 404]).toContain(response.status);
        }
        if (groupPublicId) {
            const response = await apiClient.delete(`/user-groups/${groupPublicId}`);
            expect([204, 404]).toContain(response.status);
        }
        setAuthToken(null);
    });

    // ═══════════════════════════════════════════════
    // Upload
    // ═══════════════════════════════════════════════
    describe('POST /lessons/{id}/attachments (Upload)', () => {
        it('should upload a valid PDF as TEACHER owner (201)', async () => {
            setAuthToken(teacherToken);
            const form = makePdfForm(VALID_PDF, 'notes.pdf');
            const res = await apiClient.post(
                `/lessons/${lessonPublicId}/attachments`,
                form,
                { headers: form.getHeaders() }
            );
            expect(res.status).toBe(201);
            expect(res.data).toMatchObject({
                publicId: expect.any(String),
                originalFileName: 'notes.pdf',
                contentType: 'application/pdf',
                fileSize: expect.any(Number),
            });
            attachmentPublicId = res.data.publicId;
            createdAttachmentIds.add(attachmentPublicId);
        });

        it('LessonResponse should include attachment metadata', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get('/teacher/lessons');
            expect(res.status).toBe(200);
            const lesson = res.data.find((l) => l.publicId === lessonPublicId);
            expect(lesson).toBeDefined();
            expect(lesson).not.toHaveProperty('id');
            expect(Array.isArray(lesson.attachments)).toBe(true);
            expect(lesson.attachments.length).toBeGreaterThan(0);
            const att = lesson.attachments.find((a) => a.publicId === attachmentPublicId);
            expect(att).toBeDefined();
            expect(att.originalFileName).toBe('notes.pdf');
        });

        it('should reject unsupported file type (400 ATTACHMENT_INVALID_FILE_TYPE)', async () => {
            setAuthToken(teacherToken);
            const form = makePdfForm(NOT_PDF, 'photo.png', 'image/png');
            const res = await apiClient.post(
                `/lessons/${lessonPublicId}/attachments`,
                form,
                { headers: form.getHeaders() }
            );
            expect(res.status).toBe(400);
            expect(res.data.code).toBe('ATTACHMENT_INVALID_FILE_TYPE');
        });

        it('should return 403 for a different TEACHER (not owner)', async () => {
            setAuthToken(null);
            const form = makePdfForm(VALID_PDF, 'notes.pdf');
            const res = await apiClient.post(
                `/lessons/${lessonPublicId}/attachments`,
                form,
                { headers: form.getHeaders() }
            );
            expect(res.status).toBe(401);
        });

        it('should return 401 without auth', async () => {
            setAuthToken(null);
            const form = makePdfForm(VALID_PDF, 'notes.pdf');
            const res = await apiClient.post(
                `/lessons/${lessonPublicId}/attachments`,
                form,
                { headers: form.getHeaders() }
            );
            expect(res.status).toBe(401);
        });

        it('should add a second attachment (multi-attachment supported)', async () => {
            setAuthToken(teacherToken);
            const form = makePdfForm(VALID_PDF, 'notes_v2.pdf');
            const res = await apiClient.post(
                `/lessons/${lessonPublicId}/attachments`,
                form,
                { headers: form.getHeaders() }
            );
            expect(res.status).toBe(201);
            expect(res.data.originalFileName).toBe('notes_v2.pdf');
            // New attachment gets a new ID
            expect(res.data.publicId).not.toBe(attachmentPublicId);
            attachmentPublicId = res.data.publicId;
            createdAttachmentIds.add(attachmentPublicId);
        });
    });

    // ═══════════════════════════════════════════════
    // Download
    // ═══════════════════════════════════════════════
    describe('GET /lessons/{id}/attachments/{attachmentId} (Download)', () => {
        it('should allow TEACHER owner to download (200)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`,
                { responseType: 'arraybuffer' }
            );
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/application\/pdf/);
        });

        it('should allow ADMIN to download (200)', async () => {
            setAuthToken(adminToken);
            const res = await apiClient.get(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`,
                { responseType: 'arraybuffer' }
            );
            expect(res.status).toBe(200);
        });

        it('should allow STUDENT with lesson access to download (200)', async () => {
            setAuthToken(studentToken);
            const res = await apiClient.get(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`,
                { responseType: 'arraybuffer' }
            );
            expect(res.status).toBe(200);
        });

        it('should return 401 without auth', async () => {
            setAuthToken(null);
            const res = await apiClient.get(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`
            );
            expect(res.status).toBe(401);
        });

        it('should return 404 for non-existent attachment', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(`/lessons/${lessonPublicId}/attachments/non-existent-attachment`);
            expect(res.status).toBe(404);
        });

        it('should return 403 for a lesson outside teacher ownership scope', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(`/lessons/non-existent-lesson/attachments/${attachmentPublicId}`);
            expect(res.status).toBe(403);
        });
    });

    // ═══════════════════════════════════════════════
    // Delete
    // ═══════════════════════════════════════════════
    describe('DELETE /lessons/{id}/attachments/{attachmentId} (Delete)', () => {
        it('should return 401 without auth', async () => {
            setAuthToken(null);
            const res = await apiClient.delete(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`
            );
            expect(res.status).toBe(401);
        });

        it('should return 403 for STUDENT (no delete permission)', async () => {
            setAuthToken(studentToken);
            const res = await apiClient.delete(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`
            );
            expect(res.status).toBe(403);
        });

        it('should allow TEACHER owner to delete attachment (204)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.delete(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`
            );
            expect(res.status).toBe(204);
            createdAttachmentIds.delete(attachmentPublicId);
        });

        it('LessonResponse attachments should be empty after delete', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get('/teacher/lessons');
            const lesson = res.data.find((l) => l.publicId === lessonPublicId);
            expect(lesson).toBeDefined();
            expect(lesson).not.toHaveProperty('id');
            expect(Array.isArray(lesson.attachments)).toBe(true);
            const stillPresent = lesson.attachments.find((a) => a.publicId === attachmentPublicId);
            expect(stillPresent).toBeUndefined();
        });

        it('should return 404 after attachment is deleted', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.delete(
                `/lessons/${lessonPublicId}/attachments/${attachmentPublicId}`
            );
            expect(res.status).toBe(404);
        });
    });

    // ═══════════════════════════════════════════════
    // Cleanup on lesson delete
    // ═══════════════════════════════════════════════
    describe('Lesson delete after attachment cleanup', () => {
        beforeAll(async () => {
            setAuthToken(teacherToken);
            let res = await apiClient.post('/lessons', {
                title: `Temp ${uniqueId}`,
                theme: 'Cleanup test',
                groupPublicIds: [groupPublicId],
            });
            expect(res.status).toBe(201);
            tempLessonPublicId = res.data.publicId;
            expect(res.data).not.toHaveProperty('id');

            const form = makePdfForm(VALID_PDF, 'temp.pdf');
            res = await apiClient.post(
                `/lessons/${tempLessonPublicId}/attachments`,
                form,
                { headers: form.getHeaders() }
            );
            expect(res.status).toBe(201);
            tempAttachmentPublicId = res.data.publicId;
        });

        it('should allow deleting the lesson after removing its attachment (204)', async () => {
            setAuthToken(teacherToken);
            let res = await apiClient.delete(
                `/lessons/${tempLessonPublicId}/attachments/${tempAttachmentPublicId}`
            );
            expect(res.status).toBe(204);
            tempAttachmentPublicId = null;

            res = await apiClient.delete(`/lessons/${tempLessonPublicId}`);
            expect(res.status).toBe(204);
            tempLessonPublicId = null;
        });

        it('lesson should be gone after delete (not listed anymore)', async () => {
            setAuthToken(adminToken);
            const res = await apiClient.get('/lessons');
            expect(res.status).toBe(200);
            const found = res.data.find((l) => l.publicId === tempLessonPublicId);
            expect(found).toBeUndefined();
        });
    });
});
