CREATE TABLE user_task_attention_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    task_id INT NOT NULL,
    task_type VARCHAR(64) NOT NULL,
    switch_count INT NOT NULL DEFAULT 0,
    last_switched_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_task_attention UNIQUE (user_id, lesson_id, task_id, task_type)
);

CREATE INDEX idx_user_task_attention_user_lesson
    ON user_task_attention_events (user_id, lesson_id);
