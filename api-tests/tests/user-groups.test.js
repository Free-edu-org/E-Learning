const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('User Groups API (/api/v1/user-groups)', () => {
    const uniqueId = Date.now();

    const staticAdmin = {
        email: 'admin@szkola.pl',
        username: 'admin_marek',
        password: 'admin1'
    };

    const staticStudent1 = {
        email: 'student1@edu.pl',
        username: 'jan_kowalski',
        password: 'student1'
    };

    let adminToken;
    let studentToken;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', {
            identifier: staticAdmin.username,
            password: staticAdmin.password
        });
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', {
            identifier: staticStudent1.username,
            password: staticStudent1.password
        });
        studentToken = res.data.token;
    });

    // ─── 3.1 CREATE USER GROUP ────────────────────────────────────────

    describe('POST /api/v1/user-groups (Create)', () => {
        it('should create a new user group as ADMIN (201 Created)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: `TestGroup ${uniqueId}`,
                description: 'Opis testowej grupy'
            });

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
            expect(response.data.name).toBe(`TestGroup ${uniqueId}`);
            expect(response.data.description).toBe('Opis testowej grupy');
            expect(response.data.studentCount).toBe(0);
            expect(response.data).toHaveProperty('createdAt');
        });

        it('should fail if group name already exists (409 GROUP_NAME_ALREADY_EXISTS)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: `TestGroup ${uniqueId}`,
                description: 'Duplicate name'
            });

            expect(response.status).toBe(409);
            expect(response.data.code).toBe('GROUP_NAME_ALREADY_EXISTS');
        });

        it('should fail with duplicate seed group name (409 GROUP_NAME_ALREADY_EXISTS)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: 'Angielski A1',
                description: 'Another group with same name'
            });

            expect(response.status).toBe(409);
            expect(response.data.code).toBe('GROUP_NAME_ALREADY_EXISTS');
        });

        it('should fail with missing name (400 VALIDATION_FAILED)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: '',
                description: 'Description without name'
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should fail with missing description (400 VALIDATION_FAILED)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: `GroupNoDesc ${uniqueId}`,
                description: ''
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should fail with empty body (400 VALIDATION_FAILED)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {});

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should fail with null fields (400 VALIDATION_FAILED)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: null,
                description: null
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should deny unauthenticated user (401 Unauthorized)', async () => {
            setAuthToken(null);
            const response = await apiClient.post('/user-groups', {
                name: `Unauth ${uniqueId}`,
                description: 'No token'
            });

            expect(response.status).toBe(401);
        });

        it('should deny STUDENT role (403 Forbidden)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post('/user-groups', {
                name: `StudentGroup ${uniqueId}`,
                description: 'Student tries to create'
            });

            expect([401, 403]).toContain(response.status);
        });
    });

    // ─── 3.2 GET ALL USER GROUPS ──────────────────────────────────────

    describe('GET /api/v1/user-groups (Get All)', () => {
        it('should return list of all groups as ADMIN (200 OK)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/user-groups');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThanOrEqual(2); // seed groups

            const group = response.data.find(g => g.name === 'Angielski A1');
            expect(group).toBeDefined();
            expect(group).toHaveProperty('id');
            expect(group).toHaveProperty('name');
            expect(group).toHaveProperty('description');
            expect(group).toHaveProperty('studentCount');
            expect(group).toHaveProperty('createdAt');
        });

        it('should include studentCount in response', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/user-groups');

            const groupA1 = response.data.find(g => g.name === 'Angielski A1');
            expect(groupA1).toBeDefined();
            expect(typeof groupA1.studentCount).toBe('number');
        });

        it('should deny unauthenticated user (401 Unauthorized)', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/user-groups');

            expect(response.status).toBe(401);
        });

        it('should deny STUDENT role (403 Forbidden)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/user-groups');

            expect([401, 403]).toContain(response.status);
        });
    });

    // ─── 3.3 GET USER GROUP BY ID ─────────────────────────────────────

    describe('GET /api/v1/user-groups/{id} (Get By ID)', () => {
        let existingGroupId;

        beforeAll(async () => {
            setAuthToken(adminToken);
            const res = await apiClient.get('/user-groups');
            const seedGroup = res.data.find(g => g.name === 'Angielski A1');
            existingGroupId = seedGroup.id;
        });

        it('should return group by ID as ADMIN (200 OK)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/user-groups/${existingGroupId}`);

            expect(response.status).toBe(200);
            expect(response.data.id).toBe(existingGroupId);
            expect(response.data.name).toBe('Angielski A1');
            expect(response.data).toHaveProperty('description');
            expect(response.data).toHaveProperty('studentCount');
            expect(response.data).toHaveProperty('createdAt');
        });

        it('should return 404 for non-existent group (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/user-groups/9999999');

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should deny unauthenticated user (401 Unauthorized)', async () => {
            setAuthToken(null);
            const response = await apiClient.get(`/user-groups/${existingGroupId}`);

            expect(response.status).toBe(401);
        });

        it('should deny STUDENT role (403 Forbidden)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get(`/user-groups/${existingGroupId}`);

            expect([401, 403]).toContain(response.status);
        });
    });

    // ─── 3.4 UPDATE USER GROUP ────────────────────────────────────────

    describe('PUT /api/v1/user-groups/{id} (Update)', () => {
        let groupToUpdateId;

        beforeAll(async () => {
            setAuthToken(adminToken);
            const res = await apiClient.post('/user-groups', {
                name: `UpdateTarget ${uniqueId}`,
                description: 'Will be updated'
            });
            groupToUpdateId = res.data.id;
        });

        it('should update group name and description as ADMIN (200 OK)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/user-groups/${groupToUpdateId}`, {
                name: `Updated ${uniqueId}`,
                description: 'Updated description'
            });

            expect(response.status).toBe(200);
            expect(response.data.id).toBe(groupToUpdateId);
            expect(response.data.name).toBe(`Updated ${uniqueId}`);
            expect(response.data.description).toBe('Updated description');
            expect(response.data).toHaveProperty('studentCount');
            expect(response.data).toHaveProperty('createdAt');
        });

        it('should allow keeping the same name (200 OK)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/user-groups/${groupToUpdateId}`, {
                name: `Updated ${uniqueId}`,
                description: 'Changed only description'
            });

            expect(response.status).toBe(200);
            expect(response.data.name).toBe(`Updated ${uniqueId}`);
            expect(response.data.description).toBe('Changed only description');
        });

        it('should fail when renaming to existing group name (409 GROUP_NAME_ALREADY_EXISTS)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/user-groups/${groupToUpdateId}`, {
                name: 'Angielski A1',
                description: 'Trying to steal name'
            });

            expect(response.status).toBe(409);
            expect(response.data.code).toBe('GROUP_NAME_ALREADY_EXISTS');
        });

        it('should return 404 for non-existent group (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put('/user-groups/9999999', {
                name: `Ghost ${uniqueId}`,
                description: 'Does not exist'
            });

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should fail with empty name (400 VALIDATION_FAILED)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/user-groups/${groupToUpdateId}`, {
                name: '',
                description: 'Has description'
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should fail with empty description (400 VALIDATION_FAILED)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/user-groups/${groupToUpdateId}`, {
                name: `ValidName ${uniqueId}`,
                description: ''
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should deny unauthenticated user (401 Unauthorized)', async () => {
            setAuthToken(null);
            const response = await apiClient.put(`/user-groups/${groupToUpdateId}`, {
                name: 'No auth name',
                description: 'No auth desc'
            });

            expect(response.status).toBe(401);
        });

        it('should deny STUDENT role (403 Forbidden)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.put(`/user-groups/${groupToUpdateId}`, {
                name: 'Student update',
                description: 'Student desc'
            });

            expect([401, 403]).toContain(response.status);
        });
    });

    // ─── 3.6 ADD MEMBER TO GROUP ──────────────────────────────────────

    describe('POST /api/v1/user-groups/{id}/members/{userId} (Add Member)', () => {
        let testGroupId;
        let newStudentId;
        let newStudentToken;
        let adminUserId;

        beforeAll(async () => {
            // Create a fresh group for member tests
            setAuthToken(adminToken);
            const groupRes = await apiClient.post('/user-groups', {
                name: `MemberGroup ${uniqueId}`,
                description: 'Group for member tests'
            });
            testGroupId = groupRes.data.id;

            // Create a new student who is NOT in any group
            const studentData = {
                email: `member.student.${uniqueId}@example.com`,
                username: `memberStudent${uniqueId}`,
                password: 'password123'
            };
            await apiClient.post('/users/register', studentData);

            const loginRes = await apiClient.post('/auth/login', {
                identifier: studentData.username,
                password: studentData.password
            });
            newStudentToken = loginRes.data.token;

            setAuthToken(newStudentToken);
            const meRes = await apiClient.get('/users/me');
            newStudentId = meRes.data.id;

            // Get admin user ID for INVALID_ROLE_FOR_GROUP test
            setAuthToken(adminToken);
            const adminMeRes = await apiClient.get('/users/me');
            adminUserId = adminMeRes.data.id;
        });

        it('should add a STUDENT to a group as ADMIN (204 No Content)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/user-groups/${testGroupId}/members/${newStudentId}`);

            expect(response.status).toBe(204);
        });

        it('should reflect increased studentCount after adding member', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/user-groups/${testGroupId}`);

            expect(response.status).toBe(200);
            expect(response.data.studentCount).toBe(1);
        });

        it('should fail when student is already in a group (409 STUDENT_ALREADY_IN_GROUP)', async () => {
            setAuthToken(adminToken);

            // Try adding same student to same group again
            const response = await apiClient.post(`/user-groups/${testGroupId}/members/${newStudentId}`);
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('STUDENT_ALREADY_IN_GROUP');
        });

        it('should fail when student is already in ANY group - one group per student (409 STUDENT_ALREADY_IN_GROUP)', async () => {
            setAuthToken(adminToken);

            // Create another group and try to add the same student
            const anotherGroupRes = await apiClient.post('/user-groups', {
                name: `AnotherGroup ${uniqueId}`,
                description: 'Second group'
            });
            const anotherGroupId = anotherGroupRes.data.id;

            const response = await apiClient.post(`/user-groups/${anotherGroupId}/members/${newStudentId}`);
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('STUDENT_ALREADY_IN_GROUP');
        });

        it('should fail when adding ADMIN user to group (400 INVALID_ROLE_FOR_GROUP)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/user-groups/${testGroupId}/members/${adminUserId}`);

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('INVALID_ROLE_FOR_GROUP');
        });

        it('should fail for non-existent group (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/user-groups/9999999/members/${newStudentId}`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should fail for non-existent user (404 USER_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/user-groups/${testGroupId}/members/9999999`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_NOT_FOUND');
        });

        it('should deny unauthenticated user (401 Unauthorized)', async () => {
            setAuthToken(null);
            const response = await apiClient.post(`/user-groups/${testGroupId}/members/${newStudentId}`);

            expect(response.status).toBe(401);
        });

        it('should deny STUDENT role (403 Forbidden)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.post(`/user-groups/${testGroupId}/members/${newStudentId}`);

            expect([401, 403]).toContain(response.status);
        });
    });

    // ─── 3.7 REMOVE MEMBER FROM GROUP ─────────────────────────────────

    describe('DELETE /api/v1/user-groups/{id}/members/{userId} (Remove Member)', () => {
        let testGroupId;
        let removableStudentId;

        beforeAll(async () => {
            setAuthToken(adminToken);

            // Create fresh group
            const groupRes = await apiClient.post('/user-groups', {
                name: `RemoveGroup ${uniqueId}`,
                description: 'Group for removal tests'
            });
            testGroupId = groupRes.data.id;

            // Create and add a student to the group
            const studentData = {
                email: `remove.student.${uniqueId}@example.com`,
                username: `removeStudent${uniqueId}`,
                password: 'password123'
            };
            await apiClient.post('/users/register', studentData);

            const loginRes = await apiClient.post('/auth/login', {
                identifier: studentData.username,
                password: studentData.password
            });
            const token = loginRes.data.token;

            setAuthToken(token);
            const meRes = await apiClient.get('/users/me');
            removableStudentId = meRes.data.id;

            setAuthToken(adminToken);
            await apiClient.post(`/user-groups/${testGroupId}/members/${removableStudentId}`);
        });

        it('should deny unauthenticated user (401 Unauthorized)', async () => {
            setAuthToken(null);
            const response = await apiClient.delete(`/user-groups/${testGroupId}/members/${removableStudentId}`);

            expect(response.status).toBe(401);
        });

        it('should deny STUDENT role (403 Forbidden)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.delete(`/user-groups/${testGroupId}/members/${removableStudentId}`);

            expect([401, 403]).toContain(response.status);
        });

        it('should fail for non-existent group (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/9999999/members/${removableStudentId}`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should fail when user is not a member (404 MEMBER_NOT_IN_GROUP)', async () => {
            setAuthToken(adminToken);
            // Use admin user ID — not a member of any group
            const adminMeRes = await apiClient.get('/users/me');
            const response = await apiClient.delete(`/user-groups/${testGroupId}/members/${adminMeRes.data.id}`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('MEMBER_NOT_IN_GROUP');
        });

        it('should remove member from group as ADMIN (204 No Content)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/${testGroupId}/members/${removableStudentId}`);

            expect(response.status).toBe(204);
        });

        it('should reflect decreased studentCount after removing member', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/user-groups/${testGroupId}`);

            expect(response.status).toBe(200);
            expect(response.data.studentCount).toBe(0);
        });

        it('should fail when removing already removed member (404 MEMBER_NOT_IN_GROUP)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/${testGroupId}/members/${removableStudentId}`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('MEMBER_NOT_IN_GROUP');
        });

        it('should allow re-adding student after removal (204 No Content)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/user-groups/${testGroupId}/members/${removableStudentId}`);

            expect(response.status).toBe(204);
        });
    });

    // ─── 3.5 DELETE USER GROUP ────────────────────────────────────────

    describe('DELETE /api/v1/user-groups/{id} (Delete)', () => {
        let groupToDeleteId;
        let memberStudentId;

        beforeAll(async () => {
            setAuthToken(adminToken);

            // Create a group with a member to test cascade
            const groupRes = await apiClient.post('/user-groups', {
                name: `DeleteGroup ${uniqueId}`,
                description: 'Group to be deleted'
            });
            groupToDeleteId = groupRes.data.id;

            // Create and add a student
            const studentData = {
                email: `delete.student.${uniqueId}@example.com`,
                username: `deleteStudent${uniqueId}`,
                password: 'password123'
            };
            await apiClient.post('/users/register', studentData);
            const loginRes = await apiClient.post('/auth/login', {
                identifier: studentData.username,
                password: studentData.password
            });
            setAuthToken(loginRes.data.token);
            const meRes = await apiClient.get('/users/me');
            memberStudentId = meRes.data.id;

            setAuthToken(adminToken);
            await apiClient.post(`/user-groups/${groupToDeleteId}/members/${memberStudentId}`);
        });

        it('should deny unauthenticated user (401 Unauthorized)', async () => {
            setAuthToken(null);
            const response = await apiClient.delete(`/user-groups/${groupToDeleteId}`);

            expect(response.status).toBe(401);
        });

        it('should deny STUDENT role (403 Forbidden)', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.delete(`/user-groups/${groupToDeleteId}`);

            expect([401, 403]).toContain(response.status);
        });

        it('should delete group with members as ADMIN (204 No Content)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/${groupToDeleteId}`);

            expect(response.status).toBe(204);
        });

        it('should return 404 when getting deleted group (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/user-groups/${groupToDeleteId}`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should not delete the member user account after group deletion', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/users/${memberStudentId}`);

            expect(response.status).toBe(200);
            expect(response.data.id).toBe(memberStudentId);
        });

        it('should allow student to join another group after their group was deleted', async () => {
            setAuthToken(adminToken);
            const groupRes = await apiClient.post('/user-groups', {
                name: `PostDelete ${uniqueId}`,
                description: 'Group after deletion'
            });

            const response = await apiClient.post(`/user-groups/${groupRes.data.id}/members/${memberStudentId}`);
            expect(response.status).toBe(204);
        });

        it('should return 404 when deleting already deleted group (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/${groupToDeleteId}`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should return 404 for non-existent group ID (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete('/user-groups/9999999');

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });
    });

    // ─── EDGE CASES & SECURITY ────────────────────────────────────────

    describe('Edge Cases & Security', () => {
        it('should reject request with expired/invalid JWT token', async () => {
            setAuthToken('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid');
            const response = await apiClient.get('/user-groups');

            expect(response.status).toBe(401);
        });

        it('should reject request with malformed Authorization header', async () => {
            apiClient.defaults.headers.common['Authorization'] = 'InvalidScheme token123';
            const response = await apiClient.get('/user-groups');

            expect(response.status).toBe(401);
            setAuthToken(null);
        });

        it('should handle whitespace-only name as validation error (400)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: '   ',
                description: 'Valid description'
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should handle whitespace-only description as validation error (400)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/user-groups', {
                name: `WhitespaceDesc ${uniqueId}`,
                description: '   '
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should handle creating groups with very long names', async () => {
            setAuthToken(adminToken);
            const longName = 'A'.repeat(255);
            const response = await apiClient.post('/user-groups', {
                name: longName,
                description: 'Long name group'
            });

            // Should either succeed (200/201) or fail gracefully (400/500) — not crash
            expect([201, 400, 409, 500]).toContain(response.status);
        });

        it('should return proper ProblemDetail structure on error', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/user-groups/9999999');

            expect(response.status).toBe(404);
            expect(response.data).toHaveProperty('type');
            expect(response.data).toHaveProperty('title');
            expect(response.data).toHaveProperty('status', 404);
            expect(response.data).toHaveProperty('detail');
            expect(response.data).toHaveProperty('code', 'USER_GROUP_NOT_FOUND');
        });

        it('should not expose stack traces or internal details on error', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/user-groups/9999999');

            expect(response.data).not.toHaveProperty('stackTrace');
            expect(response.data).not.toHaveProperty('exception');
            expect(response.data).not.toHaveProperty('trace');
        });
    });

    // ─── ADDITIONAL COVERAGE ──────────────────────────────────────────

    describe('Additional Coverage', () => {
        let emptyGroupId;
        let multiGroupId;
        let studentAId;
        let studentBId;

        beforeAll(async () => {
            setAuthToken(adminToken);

            // Create an empty group (no members) for delete test
            const emptyRes = await apiClient.post('/user-groups', {
                name: `EmptyGroup ${uniqueId}`,
                description: 'Group with zero members'
            });
            emptyGroupId = emptyRes.data.id;

            // Create a group for multi-member test
            const multiRes = await apiClient.post('/user-groups', {
                name: `MultiGroup ${uniqueId}`,
                description: 'Group for multiple members'
            });
            multiGroupId = multiRes.data.id;

            // Create two new students for multi-member tests
            const studentAData = {
                email: `extra.a.${uniqueId}@example.com`,
                username: `extraA${uniqueId}`,
                password: 'password123'
            };
            const studentBData = {
                email: `extra.b.${uniqueId}@example.com`,
                username: `extraB${uniqueId}`,
                password: 'password123'
            };
            await apiClient.post('/users/register', studentAData);
            await apiClient.post('/users/register', studentBData);

            let loginRes = await apiClient.post('/auth/login', { identifier: studentAData.username, password: studentAData.password });
            setAuthToken(loginRes.data.token);
            let meRes = await apiClient.get('/users/me');
            studentAId = meRes.data.id;

            loginRes = await apiClient.post('/auth/login', { identifier: studentBData.username, password: studentBData.password });
            setAuthToken(loginRes.data.token);
            meRes = await apiClient.get('/users/me');
            studentBId = meRes.data.id;

            setAuthToken(adminToken);
        });

        it('should delete an empty group (no members) as ADMIN (204 No Content)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/${emptyGroupId}`);

            expect(response.status).toBe(204);
        });

        it('should return 404 after deleting empty group', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get(`/user-groups/${emptyGroupId}`);

            expect(response.status).toBe(404);
        });

        it('should correctly count multiple students in a group', async () => {
            setAuthToken(adminToken);
            await apiClient.post(`/user-groups/${multiGroupId}/members/${studentAId}`);
            await apiClient.post(`/user-groups/${multiGroupId}/members/${studentBId}`);

            const response = await apiClient.get(`/user-groups/${multiGroupId}`);
            expect(response.status).toBe(200);
            expect(response.data.studentCount).toBe(2);
        });

        it('should return 404 when updating a deleted group (404 USER_GROUP_NOT_FOUND)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/user-groups/${emptyGroupId}`, {
                name: `Ghost Update ${uniqueId}`,
                description: 'Updating deleted group'
            });

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });

        it('should fail update with null fields (400 VALIDATION_FAILED)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put(`/user-groups/${multiGroupId}`, {
                name: null,
                description: null
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should return 404 when removing member with non-existent userId', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete(`/user-groups/${multiGroupId}/members/9999999`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('MEMBER_NOT_IN_GROUP');
        });

        it('should return 404 when adding member to a deleted group', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post(`/user-groups/${emptyGroupId}/members/${studentAId}`);

            expect(response.status).toBe(404);
            expect(response.data.code).toBe('USER_GROUP_NOT_FOUND');
        });
    });
});
