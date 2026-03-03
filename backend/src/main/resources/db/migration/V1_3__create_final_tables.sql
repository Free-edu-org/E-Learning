CREATE TABLE user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL, -- Referencja do konkretnego zadania (zależnie od logiki aplikacji)
    task_type VARCHAR(50) NOT NULL, -- nazwa tabeli z zadaniem: 'speak_tasks', 'choose_tasks', 'write_tasks', 'scatter_tasks'
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_lesson_id ON user_answers(lesson_id);
CREATE INDEX idx_user_answers_task_id ON user_answers(task_id);

CREATE TABLE user_get_achievement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INT NOT NULL REFERENCES achievement(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_in_group (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INT NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_in_group_user_group UNIQUE (user_id, group_id)
);

CREATE TABLE group_has_lesson (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
