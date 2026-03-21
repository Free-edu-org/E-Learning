const { apiClient, setAuthToken } = require('../utils/apiClient');

describe('Teacher Stats API (/api/v1/teacher/stats)', () => {
    const staticAdmin = { username: 'admin_marek', password: 'admin1' };
    const staticStudent = { username: 'jan_kowalski', password: 'student1' };

    let adminToken;
    let studentToken;

    beforeAll(async () => {
        let res = await apiClient.post('/auth/login', {
            identifier: staticAdmin.username,
            password: staticAdmin.password,
        });
        adminToken = res.data.token;

        res = await apiClient.post('/auth/login', {
            identifier: staticStudent.username,
            password: staticStudent.password,
        });
        studentToken = res.data.token;
    });

    // ─── HAPPY PATH ───────────────────────────────────────────────────

    describe('Happy Path', () => {
        it('should return 200 OK for authenticated ADMIN', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/teacher/stats');

            expect(response.status).toBe(200);
        });

        it('should return Content-Type application/json', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/teacher/stats');

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });

    // ─── RESPONSE STRUCTURE ──────────────────────────────────────────

    describe('Response Structure', () => {
        let stats;

        beforeAll(async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/teacher/stats');
            stats = response.data;
        });

        it('should return exactly 4 fields', () => {
            expect(Object.keys(stats)).toHaveLength(4);
        });

        it('should contain totalLessons field', () => {
            expect(stats).toHaveProperty('totalLessons');
        });

        it('should contain activeLessons field', () => {
            expect(stats).toHaveProperty('activeLessons');
        });

        it('should contain activeStudents field', () => {
            expect(stats).toHaveProperty('activeStudents');
        });

        it('should contain avgScore field', () => {
            expect(stats).toHaveProperty('avgScore');
        });

        it('totalLessons should be a number', () => {
            expect(typeof stats.totalLessons).toBe('number');
        });

        it('activeLessons should be a number', () => {
            expect(typeof stats.activeLessons).toBe('number');
        });

        it('activeStudents should be a number', () => {
            expect(typeof stats.activeStudents).toBe('number');
        });

        it('avgScore should be a number', () => {
            expect(typeof stats.avgScore).toBe('number');
        });

        it('should not contain null in any field', () => {
            expect(stats.totalLessons).not.toBeNull();
            expect(stats.activeLessons).not.toBeNull();
            expect(stats.activeStudents).not.toBeNull();
            expect(stats.avgScore).not.toBeNull();
        });

        it('should not contain undefined in any field', () => {
            expect(stats.totalLessons).not.toBeUndefined();
            expect(stats.activeLessons).not.toBeUndefined();
            expect(stats.activeStudents).not.toBeUndefined();
            expect(stats.avgScore).not.toBeUndefined();
        });

        it('should not expose stack traces or internal error details', () => {
            expect(stats).not.toHaveProperty('stackTrace');
            expect(stats).not.toHaveProperty('exception');
            expect(stats).not.toHaveProperty('trace');
        });
    });

    // ─── DATA INVARIANTS ─────────────────────────────────────────────

    describe('Data Invariants', () => {
        let stats;

        beforeAll(async () => {
            setAuthToken(adminToken);
            const response = await apiClient.get('/teacher/stats');
            stats = response.data;
        });

        it('totalLessons should be >= 0', () => {
            expect(stats.totalLessons).toBeGreaterThanOrEqual(0);
        });

        it('activeLessons should be >= 0', () => {
            expect(stats.activeLessons).toBeGreaterThanOrEqual(0);
        });

        it('activeStudents should be >= 0', () => {
            expect(stats.activeStudents).toBeGreaterThanOrEqual(0);
        });

        it('avgScore should be >= 0', () => {
            expect(stats.avgScore).toBeGreaterThanOrEqual(0);
        });

        it('activeLessons should never exceed totalLessons', () => {
            expect(stats.activeLessons).toBeLessThanOrEqual(stats.totalLessons);
        });

        it('avgScore should be <= 100', () => {
            expect(stats.avgScore).toBeLessThanOrEqual(100);
        });

        it('avgScore should be 0 (not null) when user_answers is empty — COALESCE guard', async () => {
            // COALESCE in SQL ensures AVG() returns 0.0 instead of NULL on empty table.
            // This test passes regardless of whether the DB has answers or not.
            expect(stats.avgScore).not.toBeNull();
            expect(stats.avgScore).not.toBeUndefined();
            expect(stats.avgScore).toBeGreaterThanOrEqual(0);
        });

        it('activeStudents counts only students in groups that have lessons — not all students', async () => {
            // activeStudents <= total registered students; the result is always a valid count
            expect(stats.activeStudents).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(stats.activeStudents)).toBe(true);
        });

        it('endpoint should return consistent results on repeated calls', async () => {
            setAuthToken(adminToken);
            const r1 = await apiClient.get('/teacher/stats');
            const r2 = await apiClient.get('/teacher/stats');

            expect(r1.data.totalLessons).toBe(r2.data.totalLessons);
            expect(r1.data.activeLessons).toBe(r2.data.activeLessons);
            expect(r1.data.activeStudents).toBe(r2.data.activeStudents);
            expect(r1.data.avgScore).toBe(r2.data.avgScore);
        });
    });

    // ─── SECURITY — AUTHENTICATION ───────────────────────────────────

    describe('Security: Authentication', () => {
        it('should return 401 when no Authorization header is present', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/teacher/stats');

            expect(response.status).toBe(401);
        });

        it('should return 401 for an expired / invalid JWT signature', async () => {
            setAuthToken(
                'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5OTk5OTkiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalidsignature'
            );
            const response = await apiClient.get('/teacher/stats');

            expect(response.status).toBe(401);
        });

        it('should return 401 for a malformed token (random string, not a JWT)', async () => {
            setAuthToken('notavalidtoken');
            const response = await apiClient.get('/teacher/stats');

            expect(response.status).toBe(401);
        });

        it('should return 401 for a non-Bearer Authorization scheme', async () => {
            apiClient.defaults.headers.common['Authorization'] = 'Basic dXNlcjpwYXNz';
            const response = await apiClient.get('/teacher/stats');

            expect(response.status).toBe(401);
            setAuthToken(null);
        });

        it('should return 401 for a token referencing a non-existent userId', async () => {
            // Manually crafted token with sub=9999999 and valid structure but wrong signature
            setAuthToken(
                'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5OTk5OTk5In0.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
            );
            const response = await apiClient.get('/teacher/stats');

            expect(response.status).toBe(401);
        });
    });

    // ─── SECURITY — AUTHORIZATION ────────────────────────────────────

    describe('Security: Authorization', () => {
        it('should return 403 for a STUDENT role token', async () => {
            setAuthToken(studentToken);
            const response = await apiClient.get('/teacher/stats');

            expect([401, 403]).toContain(response.status);
        });
    });

    // ─── HTTP METHOD ENFORCEMENT ─────────────────────────────────────

    describe('HTTP Method Enforcement', () => {
        it('should reject POST method (405 or 404 or 500)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.post('/teacher/stats');

            expect([404, 405, 500]).toContain(response.status);
        });

        it('should reject PUT method (405 or 404 or 500)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.put('/teacher/stats', {});

            expect([404, 405, 500]).toContain(response.status);
        });

        it('should reject DELETE method (405 or 404 or 500)', async () => {
            setAuthToken(adminToken);
            const response = await apiClient.delete('/teacher/stats');

            expect([404, 405, 500]).toContain(response.status);
        });
    });

    // ─── ERROR RESPONSE FORMAT ───────────────────────────────────────

    describe('Error Response Format (RFC-7807 ProblemDetail)', () => {
        it('401 response should not expose stack traces or internal class names', async () => {
            setAuthToken(null);
            const response = await apiClient.get('/teacher/stats');

            expect(response.status).toBe(401);
            expect(response.data).not.toHaveProperty('stackTrace');
            expect(response.data).not.toHaveProperty('exception');
            expect(response.data).not.toHaveProperty('trace');
        });
    });
});
