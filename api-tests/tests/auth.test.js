const { apiClient } = require('../utils/apiClient');
const {
    createPool,
    insertPasswordResetToken,
    deletePasswordResetToken,
    updateUserPasswordByEmail
} = require('../utils/db');

const SEEDED_STUDENT_PASSWORD_HASH = '$2a$10$EfQqseEyw46zbJW75uREjeFG.SG5XK/OtIKrmxHMr0xyCmgS3N5f.';

function decodeJwtPayload(token) {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

describe('Authentication API (/api/v1/auth)', () => {
    const validStudent = {
        email: 'student1@edu.pl',
        username: 'jan_kowalski',
        password: 'student1'
    };
    const dbPool = createPool();

    beforeAll(async () => {
        await updateUserPasswordByEmail(
            dbPool,
            validStudent.email,
            SEEDED_STUDENT_PASSWORD_HASH
        );
    });

    afterAll(async () => {
        await updateUserPasswordByEmail(
            dbPool,
            validStudent.email,
            SEEDED_STUDENT_PASSWORD_HASH
        );
        await dbPool.end();
    });

    describe('POST /api/v1/auth/login', () => {
        it('should authenticate user and return JWT with publicId subject (200 OK)', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: validStudent.username,
                password: validStudent.password
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('role', 'STUDENT');

            const payload = decodeJwtPayload(response.data.token);
            expect(payload.sub).toEqual(expect.any(String));
            expect(payload.sub).not.toMatch(/^\d+$/);
        });

        it('should authenticate user and return JWT with email (200 OK)', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: validStudent.email,
                password: validStudent.password
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('role', 'STUDENT');
        });

        it('should fail with invalid password (401 INVALID_CREDENTIALS)', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: validStudent.username,
                password: 'wrongpassword'
            });

            expect(response.status).toBe(401);
            expect(response.data.code).toBe('INVALID_CREDENTIALS');
        });

        it('should fail with non-existent user (401 INVALID_CREDENTIALS)', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: 'nonexistent@example.com',
                password: 'password123'
            });

            expect(response.status).toBe(401);
            expect(response.data.code).toBe('INVALID_CREDENTIALS');
        });

        it('should fail with missing fields (400 VALIDATION_FAILED)', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: '',
                password: ''
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });

    describe('Password reset flow', () => {
        it('should return the same accepted response for existing and non-existing email', async () => {
            const existingResponse = await apiClient.post('/auth/forgot-password', {
                email: validStudent.email
            });
            const missingResponse = await apiClient.post('/auth/forgot-password', {
                email: `missing.${Date.now()}@example.com`
            });

            expect(existingResponse.status).toBe(202);
            expect(missingResponse.status).toBe(202);
            expect(existingResponse.data.message).toBe('If the account exists, a reset link has been sent.');
            expect(missingResponse.data.message).toBe(existingResponse.data.message);
        });

        it('should fail forgot password with invalid payload (400 VALIDATION_FAILED)', async () => {
            const response = await apiClient.post('/auth/forgot-password', {
                email: ''
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should fail for an invalid token', async () => {
            const response = await apiClient.post('/auth/reset-password', {
                token: 'invalid-token',
                newPassword: 'AnotherPassword123!',
                confirmPassword: 'AnotherPassword123!'
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('PASSWORD_RESET_TOKEN_INVALID');
        });

        it('should fail reset password when confirmation does not match (400 PASSWORD_CONFIRMATION_MISMATCH)', async () => {
            const response = await apiClient.post('/auth/reset-password', {
                token: 'invalid-token',
                newPassword: 'AnotherPassword123!',
                confirmPassword: 'DifferentPassword123!'
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('PASSWORD_CONFIRMATION_MISMATCH');
        });

        it('should fail reset password with missing fields (400 VALIDATION_FAILED)', async () => {
            const response = await apiClient.post('/auth/reset-password', {
                token: '',
                newPassword: '',
                confirmPassword: ''
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });

        it('should fail reset password for an expired token (400 PASSWORD_RESET_TOKEN_EXPIRED)', async () => {
            const plainToken = `expired-token-${Date.now()}`;
            const { tokenHash } = await insertPasswordResetToken(dbPool, {
                userEmail: validStudent.email,
                plainToken,
                // Keep a wide time gap to avoid timezone/serialization ambiguity between Node and MySQL.
                expiresAt: new Date(Date.now() - 24 * 60 * 60_000)
            });

            try {
                const response = await apiClient.post('/auth/reset-password', {
                    token: plainToken,
                    newPassword: 'AnotherPassword123!',
                    confirmPassword: 'AnotherPassword123!'
                });

                expect(response.status).toBe(400);
                expect(response.data.code).toBe('PASSWORD_RESET_TOKEN_EXPIRED');
            } finally {
                await deletePasswordResetToken(dbPool, tokenHash);
            }
        });

        it('should fail reset password for an already used token (400 PASSWORD_RESET_TOKEN_USED)', async () => {
            const plainToken = `used-token-${Date.now()}`;
            const { tokenHash } = await insertPasswordResetToken(dbPool, {
                userEmail: validStudent.email,
                plainToken,
                expiresAt: new Date(Date.now() + 10 * 60_000),
                usedAt: new Date(Date.now() - 60_000)
            });

            try {
                const response = await apiClient.post('/auth/reset-password', {
                    token: plainToken,
                    newPassword: 'AnotherPassword123!',
                    confirmPassword: 'AnotherPassword123!'
                });

                expect(response.status).toBe(400);
                expect(response.data.code).toBe('PASSWORD_RESET_TOKEN_USED');
            } finally {
                await deletePasswordResetToken(dbPool, tokenHash);
            }
        });
    });
});
