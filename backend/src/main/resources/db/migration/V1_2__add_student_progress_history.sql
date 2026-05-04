CREATE TABLE student_progress_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    progress_date DATE NOT NULL,
    avg_score DOUBLE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_student_progress_history_user_date (user_id, progress_date),
    KEY idx_student_progress_history_user_id (user_id),
    CONSTRAINT fk_student_progress_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
