const crypto = require('crypto');
const mysql = require('mysql2/promise');

function createPool() {
    return mysql.createPool({
        host: process.env.API_TEST_DB_HOST || 'localhost',
        port: Number(process.env.API_TEST_DB_PORT || 3306),
        user: process.env.API_TEST_DB_USER || 'freeedu',
        password: process.env.API_TEST_DB_PASSWORD || 'freeedu_pass',
        database: process.env.API_TEST_DB_NAME || 'freeedu',
        waitForConnections: true,
        connectionLimit: 5
    });
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

async function findUserIdByEmail(pool, email) {
    const [rows] = await pool.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
    );

    if (!rows.length) {
        throw new Error(`User not found for email: ${email}`);
    }

    return rows[0].id;
}

async function insertPasswordResetToken(pool, {
    userEmail,
    plainToken,
    expiresAt,
    usedAt = null
}) {
    const userId = await findUserIdByEmail(pool, userEmail);
    const tokenHash = hashToken(plainToken);

    await pool.execute(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at)
         VALUES (?, ?, ?, ?)`,
        [userId, tokenHash, expiresAt, usedAt]
    );

    return { tokenHash };
}

async function deletePasswordResetToken(pool, tokenHash) {
    await pool.execute(
        'DELETE FROM password_reset_tokens WHERE token_hash = ?',
        [tokenHash]
    );
}

async function updateUserPasswordByEmail(pool, email, passwordHash) {
    await pool.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [passwordHash, email]
    );
}

module.exports = {
    createPool,
    insertPasswordResetToken,
    deletePasswordResetToken,
    updateUserPasswordByEmail
};
