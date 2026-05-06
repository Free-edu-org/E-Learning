const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Group Invitations API', () => {
    const uniqueId = Date.now();

    const staticTeacher = {
        identifier: 'pan_tomasz',
        password: 'admin1'
    };
    const staticAdmin = {
        identifier: 'admin_marek',
        password: 'admin1'
    };

    let teacherToken;
    let adminToken;
    let groupPublicId;
    let invitationToken;
    const createdGroupPublicIds = [];
    const createdUserPublicIds = [];

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', {
            identifier: staticTeacher.identifier,
            password: staticTeacher.password
        });
        teacherToken = res.data.token;

        res = await apiClient.post('/auth/login', {
            identifier: staticAdmin.identifier,
            password: staticAdmin.password
        });
        adminToken = res.data.token;

        // Create a test group owned by teacher
        setAuthToken(teacherToken);
        res = await apiClient.post('/user-groups', {
            name: `InviteTestGroup ${uniqueId}`,
            description: 'Group for invitation tests'
        });
        expect(res.status).toBe(201);
        groupPublicId = res.data.publicId;
        createdGroupPublicIds.push(groupPublicId);
    });

    afterAll(async () => {
        setAuthToken(adminToken);
        for (const uid of createdUserPublicIds) {
            await apiClient.delete(`/users/${uid}`);
        }
        for (const gid of createdGroupPublicIds) {
            await apiClient.delete(`/user-groups/${gid}`);
        }
        setAuthToken(null);
    });

    // ─── CREATE INVITATION ────────────────────────────────────────────

    describe('POST /api/v1/teacher/groups/:groupPublicId/invitations', () => {
        it('should create invitation as teacher group owner (201)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(
                `/teacher/groups/${groupPublicId}/invitations`,
                { maxUses: 5, expiresAt: '2027-12-31T23:59:59' }
            );
            expect(res.status).toBe(201);
            expect(res.data.token).toBeTruthy();
            expect(res.data.groupPublicId).toBe(groupPublicId);
            expect(res.data.maxUses).toBe(5);
            expect(res.data.usedCount).toBe(0);
            expect(res.data.isActive).toBe(true);
            invitationToken = res.data.token;
        });

        it('should reject admin creating invitation (403)', async () => {
            setAuthToken(adminToken);
            const res = await apiClient.post(
                `/teacher/groups/${groupPublicId}/invitations`,
                { maxUses: 1, expiresAt: '2027-01-01T00:00:00' }
            );
            expect(res.status).toBe(403);
        });

        it('should reject invitation with maxUses < 1 (400)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(
                `/teacher/groups/${groupPublicId}/invitations`,
                { maxUses: 0, expiresAt: '2027-12-31T23:59:59' }
            );
            expect(res.status).toBe(400);
        });

        it('should reject invitation with past expiresAt (400)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.post(
                `/teacher/groups/${groupPublicId}/invitations`,
                { maxUses: 5, expiresAt: '2020-01-01T00:00:00' }
            );
            expect(res.status).toBe(400);
        });

        it('should reject unauthenticated request (401)', async () => {
            setAuthToken(null);
            const res = await apiClient.post(
                `/teacher/groups/${groupPublicId}/invitations`,
                { maxUses: 5, expiresAt: '2027-12-31T23:59:59' }
            );
            expect(res.status).toBe(401);
        });
    });

    // ─── LIST INVITATIONS ─────────────────────────────────────────────

    describe('GET /api/v1/teacher/groups/:groupPublicId/invitations', () => {
        it('should list invitations as teacher group owner (200)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(
                `/teacher/groups/${groupPublicId}/invitations`
            );
            expect(res.status).toBe(200);
            expect(Array.isArray(res.data)).toBe(true);
            expect(res.data.length).toBeGreaterThanOrEqual(1);
        });

        it('should return 404 for non-existent group', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.get(
                `/teacher/groups/non-existent-group/invitations`
            );
            expect([403, 404]).toContain(res.status);
        });
    });

    // ─── PUBLIC INFO ──────────────────────────────────────────────────

    describe('GET /api/v1/invitations/:token', () => {
        it('should return public invitation info without auth (200)', async () => {
            setAuthToken(null);
            const res = await apiClient.get(`/invitations/${invitationToken}`);
            expect(res.status).toBe(200);
            expect(res.data.token).toBe(invitationToken);
            expect(res.data.groupName).toBeTruthy();
            expect(res.data.maxUses).toBe(5);
            expect(res.data.usedCount).toBe(0);
        });

        it('should return 404 for non-existent token', async () => {
            setAuthToken(null);
            const res = await apiClient.get(`/invitations/non-existent-token`);
            expect(res.status).toBe(404);
        });
    });

    // ─── REGISTER WITH INVITATION ─────────────────────────────────────

    describe('POST /api/v1/invitations/register', () => {
        it('should register student via invitation and return JWT (201)', async () => {
            setAuthToken(null);
            const email = `invite_student_${uniqueId}@test.com`;
            const username = `invite_student_${uniqueId}`;

            const res = await apiClient.post('/invitations/register', {
                token: invitationToken,
                email,
                username,
                password: 'StrongPass123'
            });
            expect(res.status).toBe(201);
            expect(res.data.token).toBeTruthy();
            expect(res.data.role).toBe('STUDENT');

            // Track for cleanup
            setAuthToken(res.data.token);
            const me = await apiClient.get('/users/me');
            createdUserPublicIds.push(me.data.publicId);
        });

        it('should reject duplicate email (409)', async () => {
            setAuthToken(null);
            const res = await apiClient.post('/invitations/register', {
                token: invitationToken,
                email: `invite_student_${uniqueId}@test.com`,
                username: `different_name_${uniqueId}`,
                password: 'StrongPass123'
            });
            expect(res.status).toBe(409);
            expect(res.data.code).toBe('EMAIL_ALREADY_TAKEN');
        });

        it('should reject registration with invalid token (404)', async () => {
            setAuthToken(null);
            const res = await apiClient.post('/invitations/register', {
                token: 'totally-invalid-token-xyz',
                email: `other_${uniqueId}@test.com`,
                username: `other_user_${uniqueId}`,
                password: 'StrongPass123'
            });
            expect(res.status).toBe(404);
            expect(res.data.code).toBe('INVITATION_NOT_FOUND');
        });

        it('should reject registration with missing fields (400)', async () => {
            setAuthToken(null);
            const res = await apiClient.post('/invitations/register', {
                token: invitationToken,
                email: '',
                username: '',
                password: ''
            });
            expect(res.status).toBe(400);
        });
    });

    // ─── DEACTIVATE INVITATION ────────────────────────────────────────

    describe('DELETE /api/v1/teacher/groups/:groupPublicId/invitations/:token', () => {
        it('should deactivate invitation as teacher (204)', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.delete(
                `/teacher/groups/${groupPublicId}/invitations/${invitationToken}`
            );
            expect(res.status).toBe(204);
        });

        it('should return INVITATION_INACTIVE on GET after deactivation (410)', async () => {
            setAuthToken(null);
            const res = await apiClient.get(`/invitations/${invitationToken}`);
            expect(res.status).toBe(410);
            expect(res.data.code).toBe('INVITATION_INACTIVE');
        });

        it('should return 404 when deactivating non-existent token', async () => {
            setAuthToken(teacherToken);
            const res = await apiClient.delete(
                `/teacher/groups/${groupPublicId}/invitations/non-existent`
            );
            expect(res.status).toBe(404);
        });
    });
});
