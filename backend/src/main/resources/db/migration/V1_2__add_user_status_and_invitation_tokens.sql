-- =============================================================================
-- V1.2 — Add user account status and invitation token table for email-based
--         student invitation flow (INVITED / ACTIVE statuses).
-- =============================================================================

-- Make username and password nullable to support INVITED accounts
-- (username and password are set by the student during activation).
ALTER TABLE users
    MODIFY COLUMN username VARCHAR(255) NULL,
    MODIFY COLUMN password TEXT         NULL;

-- Add account status column (default ACTIVE to keep all existing accounts working).
ALTER TABLE users
    ADD COLUMN status ENUM('ACTIVE', 'INVITED') NOT NULL DEFAULT 'ACTIVE' AFTER role;

-- Table for single-use account-activation tokens sent via email.
CREATE TABLE invitation_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    token_hash  CHAR(64)     NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    used_at     TIMESTAMP    NULL DEFAULT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_invitation_tokens_token_hash (token_hash),
    KEY idx_invitation_tokens_user_id (user_id),
    CONSTRAINT fk_invitation_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
