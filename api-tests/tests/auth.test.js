const { apiClient } = require('../utils/apiClient');

describe('Authentication API (/api/v1/auth)', () => {
    // Existing data provided by user
    const existingStudent = {
        email: 'student1@edu.pl',
        username: 'jan_kowalski',
        password: 'student1'
    };

    describe('POST /api/v1/auth/login', () => {
        it('should authenticate user and return JWT with username', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: existingStudent.username,
                password: existingStudent.password
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('role', 'STUDENT');
        });

        it('should authenticate user and return JWT with email', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: existingStudent.email,
                password: existingStudent.password
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('role', 'STUDENT');
        });

        it('should fail with invalid password', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: existingStudent.username,
                password: 'wrongpassword'
            });

            expect(response.status).toBe(401);
            expect(response.data.code).toBe('INVALID_CREDENTIALS');
        });

        it('should fail with non-existent user', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: 'nonexistent@example.com',
                password: 'password123'
            });

            expect(response.status).toBe(401);
            expect(response.data.code).toBe('INVALID_CREDENTIALS');
        });

        it('should fail with VALIDATION_FAILED for empty credentials', async () => {
            const response = await apiClient.post('/auth/login', {
                identifier: '',
                password: ''
            });

            expect(response.status).toBe(400);
            expect(response.data.code).toBe('VALIDATION_FAILED');
        });
    });
});
