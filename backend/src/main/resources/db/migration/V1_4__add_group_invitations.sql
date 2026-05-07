CREATE TABLE group_invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    created_by INT NOT NULL,
    token VARCHAR(36) NOT NULL,
    max_uses INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_group_invitations_token UNIQUE (token),
    CONSTRAINT fk_group_invitations_group FOREIGN KEY (group_id) REFERENCES user_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_invitations_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_group_invitations_token ON group_invitations (token);
CREATE INDEX idx_group_invitations_group_id ON group_invitations (group_id);
