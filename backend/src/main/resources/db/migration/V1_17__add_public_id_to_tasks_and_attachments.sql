-- choose_tasks
ALTER TABLE choose_tasks
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE choose_tasks
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE choose_tasks
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

ALTER TABLE choose_tasks
    ADD CONSTRAINT uk_choose_tasks_public_id UNIQUE (public_id);

-- write_tasks
ALTER TABLE write_tasks
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE write_tasks
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE write_tasks
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

ALTER TABLE write_tasks
    ADD CONSTRAINT uk_write_tasks_public_id UNIQUE (public_id);

-- scatter_tasks
ALTER TABLE scatter_tasks
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE scatter_tasks
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE scatter_tasks
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

ALTER TABLE scatter_tasks
    ADD CONSTRAINT uk_scatter_tasks_public_id UNIQUE (public_id);

-- speak_tasks
ALTER TABLE speak_tasks
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE speak_tasks
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE speak_tasks
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

ALTER TABLE speak_tasks
    ADD CONSTRAINT uk_speak_tasks_public_id UNIQUE (public_id);

-- lesson_attachments
ALTER TABLE lesson_attachments
    ADD COLUMN public_id VARCHAR(36) NULL;

UPDATE lesson_attachments
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE lesson_attachments
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL;

ALTER TABLE lesson_attachments
    ADD CONSTRAINT uk_lesson_attachments_public_id UNIQUE (public_id);
