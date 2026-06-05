CREATE TABLE email_change_tokens (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    user_id    INT           NOT NULL,
    token_hash CHAR(64)      NOT NULL,
    new_email  VARCHAR(255)  NOT NULL,
    expires_at TIMESTAMP     NOT NULL,
    used_at    TIMESTAMP     DEFAULT NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_email_change_tokens_token_hash (token_hash),
    KEY idx_email_change_tokens_user_id (user_id),
    KEY idx_email_change_tokens_expires_at (expires_at),
    CONSTRAINT fk_email_change_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
