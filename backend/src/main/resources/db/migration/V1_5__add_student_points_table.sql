CREATE TABLE student_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lesson_result_id INT NULL,
    delta INT NOT NULL,
    reason VARCHAR(64) NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_points_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_student_points_user_id ON student_points (user_id);
CREATE INDEX idx_student_points_lesson_result_id ON student_points (lesson_result_id);
CREATE UNIQUE INDEX uq_student_points_lesson_result_reason ON student_points (lesson_result_id, reason);

