ALTER TABLE speak_tasks ADD COLUMN expected_text TEXT NULL AFTER task;

UPDATE speak_tasks
SET expected_text = task
WHERE expected_text IS NULL OR expected_text = '';

ALTER TABLE speak_tasks MODIFY expected_text TEXT NOT NULL;

