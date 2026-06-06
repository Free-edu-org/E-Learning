ALTER TABLE choose_tasks
    ADD COLUMN teacher_id INT NULL AFTER lesson_id;

UPDATE choose_tasks ct
JOIN lessons l ON l.id = ct.lesson_id
SET ct.teacher_id = l.teacher_id
WHERE ct.teacher_id IS NULL;

ALTER TABLE choose_tasks
    MODIFY lesson_id INT NULL,
    MODIFY teacher_id INT NOT NULL,
    ADD KEY idx_choose_tasks_teacher_id (teacher_id),
    ADD CONSTRAINT fk_choose_tasks_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE write_tasks
    ADD COLUMN teacher_id INT NULL AFTER lesson_id;

UPDATE write_tasks wt
JOIN lessons l ON l.id = wt.lesson_id
SET wt.teacher_id = l.teacher_id
WHERE wt.teacher_id IS NULL;

ALTER TABLE write_tasks
    MODIFY lesson_id INT NULL,
    MODIFY teacher_id INT NOT NULL,
    ADD KEY idx_write_tasks_teacher_id (teacher_id),
    ADD CONSTRAINT fk_write_tasks_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE scatter_tasks
    ADD COLUMN teacher_id INT NULL AFTER lesson_id;

UPDATE scatter_tasks st
JOIN lessons l ON l.id = st.lesson_id
SET st.teacher_id = l.teacher_id
WHERE st.teacher_id IS NULL;

ALTER TABLE scatter_tasks
    MODIFY lesson_id INT NULL,
    MODIFY teacher_id INT NOT NULL,
    ADD KEY idx_scatter_tasks_teacher_id (teacher_id),
    ADD CONSTRAINT fk_scatter_tasks_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE speak_tasks
    ADD COLUMN teacher_id INT NULL AFTER lesson_id;

UPDATE speak_tasks st
JOIN lessons l ON l.id = st.lesson_id
SET st.teacher_id = l.teacher_id
WHERE st.teacher_id IS NULL;

ALTER TABLE speak_tasks
    MODIFY lesson_id INT NULL,
    MODIFY teacher_id INT NOT NULL,
    ADD KEY idx_speak_tasks_teacher_id (teacher_id),
    ADD CONSTRAINT fk_speak_tasks_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE;
