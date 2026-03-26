-- Add hint and section to all 4 task tables
ALTER TABLE speak_tasks ADD COLUMN hint TEXT;
ALTER TABLE speak_tasks ADD COLUMN section VARCHAR(255);

ALTER TABLE choose_tasks ADD COLUMN hint TEXT;
ALTER TABLE choose_tasks ADD COLUMN section VARCHAR(255);

ALTER TABLE write_tasks ADD COLUMN hint TEXT;
ALTER TABLE write_tasks ADD COLUMN section VARCHAR(255);

ALTER TABLE scatter_tasks ADD COLUMN hint TEXT;
ALTER TABLE scatter_tasks ADD COLUMN section VARCHAR(255);

-- Create user_lessons table for tracking student progress per lesson
CREATE TABLE user_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    score INT,
    max_score INT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    CONSTRAINT uq_user_lessons_user_lesson UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_user_lessons_user_id ON user_lessons(user_id);
CREATE INDEX idx_user_lessons_lesson_id ON user_lessons(lesson_id);
