ALTER TABLE users
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE users
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE users
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

ALTER TABLE users
    ADD CONSTRAINT uk_users_public_id UNIQUE (public_id);

ALTER TABLE users
    ALTER COLUMN public_id SET DEFAULT (UUID());
