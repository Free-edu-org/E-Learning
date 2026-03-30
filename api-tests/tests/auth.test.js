const { apiClient } = require('../utils/apiClient');

describe('Authentication API (/api/v1/auth)', () => {
    const validStudent = {
        email: 'student1@edu.pl',
        username: 'jan_kowalski',
        password: 'student1'
    };

    describe('POST /api/v1/auth/login', () => {
        it('should authenticate user and return JWT with username (200 OK)', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: validStudent.username,
                password: validStudent.password
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('role', 'STUDENT');
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
});
