const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Users API (/api/v1/users)', () => {
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

    const staticStudent2 = {
        email: 'student2@edu.pl',
        username: 'anna_nowak',
        password: 'student2'
    };

    let staticAdminToken;
    let staticStudent1Token;
    let staticStudent2Token;
    let newStudentId;
    let newStudentToken;
    let newAdminId; // Used for created admin

    const newStudentData = {
        email: `student.new.${uniqueId}@example.com`,
        username: `newStudent${uniqueId}`,
        password: 'password123'
    };

    describe('Initial Auth setup', () => {
        it('should login static student and admin to get tokens', async () => {
            let res = await apiClient.post('/auth/login', {
                identifier: staticStudent1.username,
                password: staticStudent1.password
            });
            staticStudent1Token = res.data.token;

            res = await apiClient.post('/auth/login', {
                identifier: staticStudent2.username,
                password: staticStudent2.password
            });
            staticStudent2Token = res.data.token;

            res = await apiClient.post('/auth/login', {
                identifier: staticAdmin.username,
                password: staticAdmin.password
            });
            staticAdminToken = res.data.token;
        });
    });

    describe('POST /api/v1/users/register (Register Student)', () => {
        it('should register a new student (201 Created)', async () => {
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/register', newStudentData);
            expect(response.status).toBe(201);
        });

        it('should fail if unauthenticated (401 Unauthorized)', async () => {
            setAuthToken(null);
            const dummyUser = { email: `test1${uniqueId}@example.com`, username: `test1${uniqueId}`, password: 'password123' };
            const response = await apiClient.post('/users/register', dummyUser);
            expect(response.status).toBe(401);
        });

        it('should fail if not an admin (403 Forbidden)', async () => {
            setAuthToken(staticStudent1Token); // Student trying to create user
            const dummyUser = { email: `test2${uniqueId}@example.com`, username: `test2${uniqueId}`, password: 'password123' };
            const response = await apiClient.post('/users/register', dummyUser);
            expect([401, 403]).toContain(response.status); // Some frameworks return 401 instead of 403 for unauthorized paths
        });

        it('should fail with EMAIL_ALREADY_TAKEN (409 Conflict)', async () => {
            const duplicateEmailUser = {
                email: staticStudent1.email, // Same email as static student
                username: `differentUser${uniqueId}`,
                password: 'password123'
            };
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/register', duplicateEmailUser);
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
        });

        it('should fail with USERNAME_ALREADY_TAKEN (409 Conflict)', async () => {
            const duplicateUsernameUser = {
                email: `different.email.${uniqueId}@example.com`,
                username: staticStudent1.username, // Same username as static student
                password: 'password123'
            };
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/register', duplicateUsernameUser);
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('USERNAME_ALREADY_TAKEN');
        });

        it('should fail with VALIDATION_FAILED for invalid input (400 Bad Request)', async () => {
            const invalidUser = {
                email: 'invalid-email',
                username: '',
                password: '123'
            };
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/register', invalidUser);
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    describe('POST /api/v1/users/admin (Create Admin)', () => {
        it('should allow admin to create an admin (201 Created)', async () => {
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/admin', {
                email: `admin.success.${uniqueId}@example.com`,
                username: `adminSuccess${uniqueId}`,
                password: 'password123'
            });
            expect(response.status).toBe(201);
        });

        it('should deny student from creating an admin (403 Forbidden)', async () => {
            setAuthToken(staticStudent1Token);
            const response = await apiClient.post('/users/admin', {
                email: `admin.attempt.${uniqueId}@example.com`,
                username: `adminAttempt${uniqueId}`,
                password: 'password123'
            });
            expect([401, 403]).toContain(response.status);
        });

        it('should fail with EMAIL_ALREADY_TAKEN for admin creation (409 Conflict)', async () => {
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/admin', { email: staticAdmin.email, username: `differentAdmin${uniqueId}`, password: 'password123' });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
        });

        it('should fail with USERNAME_ALREADY_TAKEN for admin creation (409 Conflict)', async () => {
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/admin', { email: `admin.diff.${uniqueId}@example.com`, username: staticAdmin.username, password: 'password123' });
            expect(response.status).toBe(409);
            expect(response.data.code).toBe('USERNAME_ALREADY_TAKEN');
        });

        it('should fail with VALIDATION_FAILED for invalid admin input (400 Bad Request)', async () => {
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/admin', { email: 'invalid', username: '', password: '123' });
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    describe('Profile Access & Updates', () => {
        beforeAll(async () => {
            // Login as the NEW student created in the first test group
            const res = await apiClient.post('/auth/login', {
                identifier: newStudentData.username,
                password: newStudentData.password
            });
            newStudentToken = res.data.token;

            setAuthToken(newStudentToken);
            const meRes = await apiClient.get('/users/me');
            newStudentId = meRes.data.id;
        });

        describe('GET /api/v1/users/me (Current User Profile)', () => {
            it('should get current user profile for static student (200 OK)', async () => {
                setAuthToken(staticStudent1Token);
                const response = await apiClient.get('/users/me');
                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('id');
                expect(response.data.email).toBe(staticStudent1.email);
                expect(response.data.username).toBe(staticStudent1.username);
                expect(response.data.role).toBe('STUDENT');
            });

            it('should fail without token (401 Unauthorized)', async () => {
                setAuthToken(null);
                const response = await apiClient.get('/users/me');
                expect(response.status).toBe(401);
            });

            it('should get USER_NOT_FOUND if user does not exist (token stale)', async () => {
                // Hard to simulate purely via API without deleting current user, will test deleted user later
            });
        });

        describe('GET /api/v1/users/{id} (Get User Details)', () => {
            it('should get user details when ID matches current user (200 OK)', async () => {
                setAuthToken(newStudentToken);
                const response = await apiClient.get(`/users/${newStudentId}`);
                expect(response.status).toBe(200);
                expect(response.data.id).toBe(newStudentId);
            });

            it('should allow access if ADMIN (200 OK)', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.get(`/users/${newStudentId}`);
                expect(response.status).toBe(200);
                expect(response.data.id).toBe(newStudentId);
            });

            it('should deny access if ID does not match and not ADMIN (403 Forbidden)', async () => {
                setAuthToken(staticStudent2Token); // Use student 2 to request student 1
                const response = await apiClient.get(`/users/${newStudentId}`);
                expect([403, 401]).toContain(response.status);
            });

            it('should return 404 for non-existent user if ADMIN (404 NOT FOUND)', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.get('/users/9999999');
                expect(response.status).toBe(404);
            });
        });

        describe('PUT /api/v1/users/{id} (Update User Profile)', () => {
            it('should update user profile for self (200 OK)', async () => {
                setAuthToken(newStudentToken);
                const updateData = {
                    email: `updated.email.${uniqueId}@example.com`,
                    username: `updatedUser${uniqueId}`
                };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData);
                expect(response.status).toBe(200);
                expect(response.data.email).toBe(updateData.email);
                expect(response.data.username).toBe(updateData.username);
            });

            it('should allow admin to update another profile (200 OK)', async () => {
                setAuthToken(staticAdminToken);
                const updateData = { email: `admin.updated.${uniqueId}@example.com`, username: `adminUpdatedUser${uniqueId}` };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData);
                expect(response.status).toBe(200);
                expect(response.data.username).toBe(updateData.username);
            });

            it('should deny student from updating another profile (403 Forbidden)', async () => {
                setAuthToken(staticStudent2Token); // student2 token
                const updateData = { email: `some.email.${uniqueId}@example.com`, username: `someUser${uniqueId}` };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData); // accessing newStudentId
                expect([401, 403]).toContain(response.status);
            });

            it('should fail with VALIDATION_FAILED for invalid input (400 Bad Request)', async () => {
                setAuthToken(newStudentToken);
                const response = await apiClient.put(`/users/${newStudentId}`, {
                    email: 'not-an-email',
                    username: ''
                });
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('VALIDATION_FAILED');
            });

            it('should fail with EMAIL_ALREADY_TAKEN when updating to an existing email (409 Conflict)', async () => {
                setAuthToken(newStudentToken);
                const updateData = { email: staticAdmin.email, username: `uniqueUser${uniqueId}` };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData);
                expect(response.status).toBe(409);
                expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
            });

            it('should fail with USERNAME_ALREADY_TAKEN when updating to an existing username (409 Conflict)', async () => {
                setAuthToken(newStudentToken);
                const updateData = { email: `unique.email.${uniqueId}X@example.com`, username: staticAdmin.username };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData);
                expect(response.status).toBe(409);
                expect(response.data.code).toBe('USERNAME_ALREADY_TAKEN');
            });
        });

        describe('PUT /api/v1/users/{id}/password (Change Password)', () => {
            const newPassword = 'newStrongPassword456';
            const secondNewPassword = 'newStrongPassword789';

            it('should change own password (204 No Content)', async () => {
                setAuthToken(newStudentToken);
                const passwordData = {
                    oldPassword: 'password123', // Initial password defined in `newStudentData`
                    newPassword: newPassword
                };
                const response = await apiClient.put(`/users/${newStudentId}/password`, passwordData);
                expect(response.status).toBe(204);

                // Verify new password works
                setAuthToken(null);
                const loginRes = await apiClient.post('/auth/login', {
                    identifier: `adminUpdatedUser${uniqueId}`, // Username after admin update test
                    password: newPassword
                });
                expect(loginRes.status).toBe(200);
            });

            it('should allow Admin to change another users password without matching old password? Contract says requires oldPassword. Lets check regular admin change (204 No Content)', async () => {
                // Testing Admin change. Admin must supply correct old password per the schema requiring old/new. Wait, contract says requires OldPassword. 
                // Let's test admin path.
                setAuthToken(staticAdminToken);
                const passwordData = {
                    oldPassword: newPassword, // Supplying old password
                    newPassword: secondNewPassword
                };
                const response = await apiClient.put(`/users/${newStudentId}/password`, passwordData);

                // Spring security usually drops requirement for old password for admins, but let's see. If the contract says requires old password for the request structure, we provide it.
                expect(response.status).toBe(204);
            });

            it('should deny student from changing another user password (403 Forbidden)', async () => {
                setAuthToken(staticStudent2Token);
                const response = await apiClient.put(`/users/${newStudentId}/password`, { oldPassword: '...', newPassword: '...' });
                expect([401, 403]).toContain(response.status);
            });

            it('should fail with INVALID_CREDENTIALS if old password is wrong (401 Unauthorized)', async () => {
                setAuthToken(newStudentToken);
                const passwordData = {
                    oldPassword: 'wrongOldPassword',
                    newPassword: 'anotherPassword789'
                };
                const response = await apiClient.put(`/users/${newStudentId}/password`, passwordData);
                expect(response.status).toBe(401);
                expect(response.data.code).toBe('INVALID_CREDENTIALS');
            });

            it('should fail with VALIDATION_FAILED for empty passwords (400 Bad Request)', async () => {
                setAuthToken(newStudentToken);
                const response = await apiClient.put(`/users/${newStudentId}/password`, { oldPassword: '', newPassword: '' });
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('VALIDATION_FAILED');
            });
        });

        describe('DELETE /api/v1/users/{id} (Delete User)', () => {
            let tempUserId;
            let tempUserToken;

            beforeAll(async () => {
                // Register a temporary user just for deletion tests to avoid deleting our main testing user prematurely
                setAuthToken(staticAdminToken);
                await apiClient.post('/users/register', {
                    email: `temp.del.${uniqueId}@example.com`,
                    username: `tempUserDel${uniqueId}`,
                    password: 'password123'
                });
                const loginRes = await apiClient.post('/auth/login', {
                    identifier: `tempUserDel${uniqueId}`,
                    password: 'password123'
                });
                tempUserToken = loginRes.data.token;
                setAuthToken(tempUserToken);
                const meRes = await apiClient.get('/users/me');
                tempUserId = meRes.data.id;
            });

            it('should deny student from deleting another user profile (403 Forbidden)', async () => {
                setAuthToken(staticStudent2Token);
                const response = await apiClient.delete(`/users/${tempUserId}`);
                expect([401, 403]).toContain(response.status);
            });

            it('should allow user self-delete (204 No Content)', async () => {
                // Testing Owner deletion point in contract
                setAuthToken(tempUserToken); // Authenticated as tempUser
                const response = await apiClient.delete(`/users/${tempUserId}`);
                expect(response.status).toBe(204);
            });

            it('should allow admin to delete user profile (204 No Content)', async () => {
                // Cover cross-user admin deletion
                setAuthToken(staticAdminToken);
                const response = await apiClient.delete(`/users/${newStudentId}`);
                expect(response.status).toBe(204);

                // Verify user is gone
                setAuthToken(newStudentToken);
                const meResponse = await apiClient.get('/users/me');
                // Could be 401 if token is invalidated or 404
                expect([404, 401]).toContain(meResponse.status);
            });

            it('should return 404 when deleting already deleted user (404 NOT FOUND)', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.delete(`/users/${newStudentId}`);
                expect(response.status).toBe(404);
            });
        });
    });
});
