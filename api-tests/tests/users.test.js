const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Users API (/api/v1/users)', () => {
    const uniqueId = Date.now();

    // Existing data provided by user
    const staticAdmin = {
        email: 'admin@szkola.pl',
        username: 'admin_marek',
        password: 'admin1'
    };

    const staticStudent = {
        email: 'student1@edu.pl',
        username: 'jan_kowalski',
        password: 'student1'
    };

    const newStudentData = {
        email: `student.new.${uniqueId}@example.com`,
        username: `newStudent${uniqueId}`,
        password: 'password123'
    };

    let newStudentId;
    let newStudentToken;
    let staticStudentToken;
    let staticAdminToken;

    describe('Initial Auth setup', () => {
        it('should login static student and admin to get tokens', async () => {
            let res = await apiClient.post('/auth/login', {
                identifier: staticStudent.username,
                password: staticStudent.password
            });
            staticStudentToken = res.data.token;

            res = await apiClient.post('/auth/login', {
                identifier: staticAdmin.username,
                password: staticAdmin.password
            });
            staticAdminToken = res.data.token;
        });
    });

    describe('POST /api/v1/users/register', () => {
        it('should register a new student', async () => {
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/register', newStudentData);
            expect(response.status).toBe(201);
        });

        it('should fail if unauthenticated (401)', async () => {
            setAuthToken(null);
            const dummyUser = { email: `test1${uniqueId}@example.com`, username: `test1${uniqueId}`, password: 'password123' };
            const response = await apiClient.post('/users/register', dummyUser);
            expect(response.status).toBe(401);
        });

        it('should fail if not an admin (403)', async () => {
            setAuthToken(staticStudentToken);
            const dummyUser = { email: `test2${uniqueId}@example.com`, username: `test2${uniqueId}`, password: 'password123' };
            const response = await apiClient.post('/users/register', dummyUser);
            expect([401, 403]).toContain(response.status);
        });

        it('should fail with EMAIL_ALREADY_TAKEN', async () => {
            const duplicateEmailUser = {
                email: staticStudent.email, // Same email as static student
                username: `differentUser${uniqueId}`,
                password: 'password123'
            };
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/register', duplicateEmailUser);
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
        });

        it('should fail with USERNAME_ALREADY_TAKEN', async () => {
            const duplicateUsernameUser = {
                email: `different.email.${uniqueId}@example.com`,
                username: staticStudent.username, // Same username as static student
                password: 'password123'
            };
            setAuthToken(staticAdminToken);
            const response = await apiClient.post('/users/register', duplicateUsernameUser);
            expect(response.status).toBe(400);
            expect(response.data.code).toBe('USERNAME_ALREADY_TAKEN');
        });

        it('should fail with VALIDATION_FAILED for invalid input', async () => {
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

    describe('Authentication & Profile Access', () => {
        beforeAll(async () => {
            // Login as the NEW student to get a token and fetch its ID. We will use it for modification tests.
            const res = await apiClient.post('/auth/login', {
                identifier: newStudentData.username,
                password: newStudentData.password
            });
            newStudentToken = res.data.token;

            setAuthToken(newStudentToken);
            const meRes = await apiClient.get('/users/me');
            newStudentId = meRes.data.id;
        });

        afterAll(() => {
            setAuthToken(null);
        });

        describe('GET /api/v1/users/me', () => {
            it('should get current user profile for static student', async () => {
                setAuthToken(staticStudentToken);
                const response = await apiClient.get('/users/me');
                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('id');
                expect(response.data.email).toBe(staticStudent.email);
                expect(response.data.username).toBe(staticStudent.username);
                expect(response.data.role).toBe('STUDENT');
            });

            it('should fail without token (401)', async () => {
                setAuthToken(null);
                const response = await apiClient.get('/users/me');
                expect(response.status).toBe(401);
            });
        });

        describe('GET /api/v1/users/{id}', () => {
            it('should get user details when ID matches current user', async () => {
                setAuthToken(newStudentToken);
                const response = await apiClient.get(`/users/${newStudentId}`);
                expect(response.status).toBe(200);
                expect(response.data.id).toBe(newStudentId);
            });

            it('should deny access if ID does not match and not ADMIN (403)', async () => {
                setAuthToken(staticStudentToken);
                const response = await apiClient.get(`/users/${newStudentId}`); // Access someone else's profile
                expect([403, 401]).toContain(response.status);
            });

            it('should allow access if ADMIN', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.get(`/users/${newStudentId}`);
                expect(response.status).toBe(200);
                expect(response.data.id).toBe(newStudentId);
            });

            it('should return 404 for non-existent user if ADMIN', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.get('/users/9999999');
                expect(response.status).toBe(404);
            });
        });

        describe('PUT /api/v1/users/{id}', () => {
            it('should update user profile', async () => {
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

            it('should fail with VALIDATION_FAILED for invalid input', async () => {
                setAuthToken(newStudentToken);
                const response = await apiClient.put(`/users/${newStudentId}`, {
                    email: 'not-an-email',
                    username: ''
                });
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('VALIDATION_FAILED');
            });

            it('should fail with EMAIL_ALREADY_TAKEN when updating to an existing email', async () => {
                setAuthToken(newStudentToken);
                const updateData = { email: staticAdmin.email, username: `uniqueUser${uniqueId}` };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData);
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
            });

            it('should fail with USERNAME_ALREADY_TAKEN when updating to an existing username', async () => {
                setAuthToken(newStudentToken);
                const updateData = { email: `unique.email.${uniqueId}X@example.com`, username: staticAdmin.username };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData);
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('USERNAME_ALREADY_TAKEN');
            });

            it('should deny student from updating another profile (403)', async () => {
                setAuthToken(staticStudentToken); // student token
                const updateData = { email: `some.email.${uniqueId}@example.com`, username: `someUser${uniqueId}` };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData); // accessing newStudentId
                expect([401, 403]).toContain(response.status);
            });

            it('should allow admin to update another profile', async () => {
                setAuthToken(staticAdminToken);
                const updateData = { email: `admin.updated.${uniqueId}@example.com`, username: `adminUpdatedUser${uniqueId}` };
                const response = await apiClient.put(`/users/${newStudentId}`, updateData);
                expect(response.status).toBe(200);
                expect(response.data.username).toBe(updateData.username);
            });
        });

        describe('PUT /api/v1/users/{id}/password', () => {
            it('should change password', async () => {
                setAuthToken(newStudentToken);
                const passwordData = {
                    oldPassword: newStudentData.password,
                    newPassword: 'newStrongPassword456'
                };
                const response = await apiClient.put(`/users/${newStudentId}/password`, passwordData);
                expect(response.status).toBe(204);

                // Verify new password works
                setAuthToken(null);
                const loginRes = await apiClient.post('/auth/login', {
                    identifier: `adminUpdatedUser${uniqueId}`, // Note: username was previously updated by admin test above
                    password: passwordData.newPassword
                });
                expect(loginRes.status).toBe(200);
                setAuthToken(loginRes.data.token);
            });

            it('should fail with INVALID_CREDENTIALS if old password is wrong', async () => {
                setAuthToken(newStudentToken);
                const passwordData = {
                    oldPassword: 'wrongOldPassword',
                    newPassword: 'anotherPassword789'
                };
                const response = await apiClient.put(`/users/${newStudentId}/password`, passwordData);
                expect(response.status).toBe(401);
                expect(response.data.code).toBe('INVALID_CREDENTIALS');
            });

            it('should fail with VALIDATION_FAILED for empty passwords', async () => {
                setAuthToken(newStudentToken);
                const response = await apiClient.put(`/users/${newStudentId}/password`, { oldPassword: '', newPassword: '' });
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('VALIDATION_FAILED');
            });

            it('should deny student from changing another user password (403)', async () => {
                setAuthToken(staticStudentToken);
                const response = await apiClient.put(`/users/${newStudentId}/password`, { oldPassword: '...', newPassword: '...' });
                expect([401, 403]).toContain(response.status);
            });
        });

        describe('POST /api/v1/users/admin', () => {
            it('should deny student from creating an admin (403)', async () => {
                setAuthToken(staticStudentToken);
                const response = await apiClient.post('/users/admin', {
                    email: `admin.attempt.${uniqueId}@example.com`,
                    username: `adminAttempt${uniqueId}`,
                    password: 'password123'
                });
                expect([401, 403]).toContain(response.status);
            });

            it('should allow admin to create an admin (201)', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.post('/users/admin', {
                    email: `admin.success.${uniqueId}@example.com`,
                    username: `adminSuccess${uniqueId}`,
                    password: 'password123'
                });
                expect(response.status).toBe(201);
            });

            it('should fail with EMAIL_ALREADY_TAKEN for admin creation', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.post('/users/admin', { email: staticAdmin.email, username: `differentAdmin${uniqueId}`, password: 'password123' });
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('EMAIL_ALREADY_TAKEN');
            });

            it('should fail with VALIDATION_FAILED for invalid admin input', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.post('/users/admin', { email: 'invalid', username: '', password: '123' });
                expect(response.status).toBe(400);
                expect(response.data.code).toBe('VALIDATION_FAILED');
            });
        });

        describe('DELETE /api/v1/users/{id}', () => {
            it('should deny student from deleting another user profile (403)', async () => {
                setAuthToken(staticStudentToken);
                const response = await apiClient.delete(`/users/${newStudentId}`);
                expect([401, 403]).toContain(response.status);
            });

            it('should allow admin to delete user profile', async () => {
                // By doing this instead of student self-delete, we cover the cross-user admin deletion
                setAuthToken(staticAdminToken);
                const response = await apiClient.delete(`/users/${newStudentId}`);
                expect(response.status).toBe(204);

                // Verify user is gone
                setAuthToken(newStudentToken);
                const meResponse = await apiClient.get('/users/me');
                expect([404, 401]).toContain(meResponse.status);
            });

            it('should return 404 when deleting already deleted user', async () => {
                setAuthToken(staticAdminToken);
                const response = await apiClient.delete(`/users/${newStudentId}`);
                expect(response.status).toBe(404);
            });
        });
    });
});
