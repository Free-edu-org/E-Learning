CREATE TABLE user_answers (
    id SERIAL PRIMARY KEY,
    task_id INT, -- Referencja do konkretnego zadania (zależnie od logiki aplikacji)
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    answer TEXT,
    is_correct BOOLEAN
);

CREATE TABLE user_get_achievement (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INT REFERENCES achivments(id) ON DELETE CASCADE
);

CREATE TABLE user_in_group (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    group_id INT REFERENCES user_groups(id) ON DELETE CASCADE
);

CREATE TABLE group_has_lesson (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES user_groups(id) ON DELETE CASCADE,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE
);
