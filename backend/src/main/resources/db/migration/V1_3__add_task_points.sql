-- =============================================================================
-- Add points column to tasks
-- =============================================================================

ALTER TABLE choose_tasks ADD COLUMN points INT NOT NULL DEFAULT 1;
ALTER TABLE write_tasks ADD COLUMN points INT NOT NULL DEFAULT 1;
ALTER TABLE scatter_tasks ADD COLUMN points INT NOT NULL DEFAULT 1;
ALTER TABLE speak_tasks ADD COLUMN points INT NOT NULL DEFAULT 1;
