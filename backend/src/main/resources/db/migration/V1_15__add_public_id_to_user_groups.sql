ALTER TABLE user_groups
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE user_groups
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE user_groups
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

ALTER TABLE user_groups
    ADD CONSTRAINT uk_user_groups_public_id UNIQUE (public_id);
