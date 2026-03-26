ALTER TABLE users
    ADD COLUMN teacher_id INT NULL;

ALTER TABLE users
    ADD CONSTRAINT fk_users_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id)
            ON DELETE SET NULL;

CREATE INDEX idx_users_teacher_id ON users(teacher_id);

UPDATE users u
JOIN user_in_group uig ON uig.user_id = u.id
JOIN user_groups ug ON ug.id = uig.group_id
SET u.teacher_id = ug.teacher_id
WHERE u.role = 'STUDENT' AND u.teacher_id IS NULL;
