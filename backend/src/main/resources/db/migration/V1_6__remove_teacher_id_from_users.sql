-- Remove teacher_id foreign key, index and column from users table
ALTER TABLE users DROP FOREIGN KEY fk_users_teacher;
ALTER TABLE users DROP INDEX idx_users_teacher_id;
ALTER TABLE users DROP COLUMN teacher_id;
