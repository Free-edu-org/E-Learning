ALTER TABLE student_progress_history
    ADD COLUMN lesson_id INT NULL AFTER user_id;

ALTER TABLE student_progress_history
    DROP INDEX uk_student_progress_history_user_date,
    ADD UNIQUE KEY uk_student_progress_history_user_lesson_date (user_id, lesson_id, progress_date),
    ADD KEY idx_student_progress_history_user_lesson_id (user_id, lesson_id),
    ADD CONSTRAINT fk_student_progress_history_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE;
