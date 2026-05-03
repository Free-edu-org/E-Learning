ALTER TABLE lessons
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE lessons
SET public_id = UUID()
WHERE public_id IS NULL;

ALTER TABLE lessons
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

CREATE UNIQUE INDEX uk_lessons_public_id ON lessons (public_id);
