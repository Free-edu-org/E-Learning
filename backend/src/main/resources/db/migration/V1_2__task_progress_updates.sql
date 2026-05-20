CREATE TABLE speak_attempts (
    id                     INT           NOT NULL AUTO_INCREMENT,
    public_id              VARCHAR(36)   NOT NULL,
    user_id                INT           NOT NULL,
    lesson_id              INT           NOT NULL,
    task_id                INT           NOT NULL,
    user_lesson_id         INT           NOT NULL,
    expected_text          TEXT          NOT NULL,
    raw_transcription      TEXT          NOT NULL,
    matched_transcription  TEXT          NOT NULL,
    normalized_expected    TEXT          NOT NULL,
    normalized_actual      TEXT          NOT NULL,
    score                  DOUBLE        NOT NULL,
    is_correct             TINYINT(1)    NOT NULL,
    words_json             TEXT          NOT NULL,
    language               VARCHAR(32)   DEFAULT NULL,
    duration               DOUBLE        DEFAULT NULL,
    submitted_at           TIMESTAMP     NULL DEFAULT NULL,
    created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_speak_attempts_public_id (public_id),
    KEY idx_speak_attempts_user_id (user_id),
    KEY idx_speak_attempts_lesson_id (lesson_id),
    KEY idx_speak_attempts_user_lesson_id (user_lesson_id),
    KEY idx_speak_attempts_task_id (task_id),
    KEY idx_speak_attempts_submitted_at (submitted_at),
    KEY idx_speak_attempts_created_at (created_at),
    KEY idx_speak_attempts_user_lesson_task_submitted (user_lesson_id, task_id, submitted_at),
    KEY idx_speak_attempts_submitted_created (submitted_at, created_at),
    CONSTRAINT fk_speak_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_speak_attempts_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    CONSTRAINT fk_speak_attempts_user_lesson FOREIGN KEY (user_lesson_id) REFERENCES user_lessons (id) ON DELETE CASCADE,
    CONSTRAINT fk_speak_attempts_task FOREIGN KEY (task_id) REFERENCES speak_tasks (id) ON DELETE CASCADE
);

ALTER TABLE student_progress_history
    ADD COLUMN lesson_id INT NULL AFTER user_id;

ALTER TABLE student_progress_history
    DROP INDEX uk_student_progress_history_user_date,
    ADD UNIQUE KEY uk_student_progress_history_user_lesson_date (user_id, lesson_id, progress_date),
    ADD KEY idx_student_progress_history_user_lesson_id (user_id, lesson_id),
    ADD CONSTRAINT fk_student_progress_history_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE;
