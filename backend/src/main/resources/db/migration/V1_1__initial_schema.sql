-- =============================================================================
-- Initial schema — consolidated
-- =============================================================================

CREATE TABLE users (
    id           INT            NOT NULL AUTO_INCREMENT,
    email        VARCHAR(255)   NOT NULL,
    username     VARCHAR(255)   NOT NULL,
    password     TEXT           NOT NULL,
    role         ENUM('ADMIN','STUDENT','TEACHER') NOT NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    avatar_url   VARCHAR(512)   DEFAULT NULL,
    token_version INT           NOT NULL DEFAULT 0,
    public_id    VARCHAR(36)    NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY email (email),
    UNIQUE KEY username (username),
    UNIQUE KEY uk_users_public_id (public_id)
);

CREATE TABLE user_groups (
    id          INT           NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255)  NOT NULL,
    description TEXT          NOT NULL,
    teacher_id  INT           DEFAULT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    public_id   VARCHAR(36)   NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY name (name),
    UNIQUE KEY uk_user_groups_public_id (public_id),
    KEY idx_user_groups_teacher_id (teacher_id),
    CONSTRAINT user_groups_ibfk_1 FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE lessons (
    id         INT          NOT NULL AUTO_INCREMENT,
    title      TEXT         NOT NULL,
    theme      TEXT         NOT NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    teacher_id INT          NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    public_id  VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY uk_lessons_public_id (public_id),
    KEY idx_lesson_teacher_id (teacher_id),
    CONSTRAINT lessons_ibfk_1 FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE choose_tasks (
    id                    INT          NOT NULL AUTO_INCREMENT,
    lesson_id             INT          NOT NULL,
    task                  TEXT         NOT NULL,
    possible_answers      TEXT         NOT NULL,
    correct_answer        INT          NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hint                  TEXT         DEFAULT NULL,
    hint_image_file_name  VARCHAR(255) DEFAULT NULL,
    section               VARCHAR(255) DEFAULT NULL,
    public_id             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY uk_choose_tasks_public_id (public_id),
    KEY lesson_id (lesson_id),
    CONSTRAINT choose_tasks_ibfk_1 FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE write_tasks (
    id                    INT          NOT NULL AUTO_INCREMENT,
    lesson_id             INT          NOT NULL,
    task                  TEXT         NOT NULL,
    correct_answer        TEXT         NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hint                  TEXT         DEFAULT NULL,
    hint_image_file_name  VARCHAR(255) DEFAULT NULL,
    section               VARCHAR(255) DEFAULT NULL,
    public_id             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY uk_write_tasks_public_id (public_id),
    KEY lesson_id (lesson_id),
    CONSTRAINT write_tasks_ibfk_1 FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE scatter_tasks (
    id                    INT          NOT NULL AUTO_INCREMENT,
    lesson_id             INT          NOT NULL,
    task                  TEXT         NOT NULL,
    words                 TEXT         NOT NULL,
    correct_answer        TEXT         NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hint                  TEXT         DEFAULT NULL,
    hint_image_file_name  VARCHAR(255) DEFAULT NULL,
    section               VARCHAR(255) DEFAULT NULL,
    public_id             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY uk_scatter_tasks_public_id (public_id),
    KEY lesson_id (lesson_id),
    CONSTRAINT scatter_tasks_ibfk_1 FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE speak_tasks (
    id                    INT          NOT NULL AUTO_INCREMENT,
    lesson_id             INT          NOT NULL,
    expected_text         TEXT         NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hint                  TEXT         DEFAULT NULL,
    hint_image_file_name  VARCHAR(255) DEFAULT NULL,
    section               VARCHAR(255) DEFAULT NULL,
    public_id             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY uk_speak_tasks_public_id (public_id),
    KEY lesson_id (lesson_id),
    CONSTRAINT speak_tasks_ibfk_1 FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE lesson_attachments (
    id                 INT           NOT NULL AUTO_INCREMENT,
    lesson_id          INT           NOT NULL,
    original_file_name VARCHAR(255)  NOT NULL,
    stored_file_name   VARCHAR(255)  NOT NULL,
    content_type       VARCHAR(100)  NOT NULL,
    file_size          BIGINT        NOT NULL,
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    public_id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
    PRIMARY KEY (id),
    UNIQUE KEY uk_lesson_attachments_public_id (public_id),
    KEY idx_lesson_attachment_lesson (lesson_id),
    CONSTRAINT fk_lesson_attachment_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE user_in_group (
    id         INT       NOT NULL AUTO_INCREMENT,
    user_id    INT       NOT NULL,
    group_id   INT       NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_in_group_user (user_id),
    KEY group_id (group_id),
    CONSTRAINT user_in_group_ibfk_1 FOREIGN KEY (user_id)  REFERENCES users (id)       ON DELETE CASCADE,
    CONSTRAINT user_in_group_ibfk_2 FOREIGN KEY (group_id) REFERENCES user_groups (id) ON DELETE CASCADE
);

CREATE TABLE group_has_lesson (
    id         INT       NOT NULL AUTO_INCREMENT,
    group_id   INT       NOT NULL,
    lesson_id  INT       NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY group_id (group_id),
    KEY lesson_id (lesson_id),
    CONSTRAINT group_has_lesson_ibfk_1 FOREIGN KEY (group_id)  REFERENCES user_groups (id) ON DELETE CASCADE,
    CONSTRAINT group_has_lesson_ibfk_2 FOREIGN KEY (lesson_id) REFERENCES lessons (id)     ON DELETE CASCADE
);

CREATE TABLE user_lessons (
    id          INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    lesson_id   INT          NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
    score       INT          DEFAULT 0,
    max_score   INT          DEFAULT 0,
    started_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP    DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_lesson (user_id, lesson_id),
    KEY idx_user_lessons_user_id (user_id),
    KEY idx_user_lessons_lesson_id (lesson_id),
    CONSTRAINT user_lessons_ibfk_1 FOREIGN KEY (user_id)   REFERENCES users (id)   ON DELETE CASCADE,
    CONSTRAINT user_lessons_ibfk_2 FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE user_answers (
    id         INT         NOT NULL AUTO_INCREMENT,
    task_id    INT         NOT NULL,
    task_type  VARCHAR(50) NOT NULL,
    user_id    INT         NOT NULL,
    lesson_id  INT         NOT NULL,
    answer     TEXT        NOT NULL,
    is_correct TINYINT(1)  NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_answers_user_id (user_id),
    KEY idx_user_answers_lesson_id (lesson_id),
    KEY idx_user_answers_task_id (task_id),
    CONSTRAINT user_answers_ibfk_1 FOREIGN KEY (user_id)   REFERENCES users (id)   ON DELETE CASCADE,
    CONSTRAINT user_answers_ibfk_2 FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE achievements (
    id          INT          NOT NULL AUTO_INCREMENT,
    code        VARCHAR(64)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon        VARCHAR(32)  NOT NULL DEFAULT '',
    color       VARCHAR(32)  NOT NULL DEFAULT 'warning',
    type        VARCHAR(64)  NOT NULL,
    threshold   INT          DEFAULT NULL,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order  INT          DEFAULT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_achievements_code (code)
);

CREATE TABLE user_get_achievement (
    id             INT       NOT NULL AUTO_INCREMENT,
    user_id        INT       NOT NULL,
    achievement_id INT       NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_get_achievement_user_achievement (user_id, achievement_id),
    KEY user_id (user_id),
    KEY achievement_id (achievement_id),
    CONSTRAINT user_get_achievement_ibfk_1 FOREIGN KEY (user_id)        REFERENCES users (id)        ON DELETE CASCADE,
    CONSTRAINT user_get_achievement_ibfk_2 FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
    id         BIGINT    NOT NULL AUTO_INCREMENT,
    user_id    INT       NOT NULL,
    token_hash CHAR(64)  NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at    TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY token_hash (token_hash),
    KEY idx_password_reset_tokens_user_id (user_id),
    KEY idx_password_reset_tokens_expires_at (expires_at),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE student_progress_history (
    id            INT       NOT NULL AUTO_INCREMENT,
    user_id       INT       NOT NULL,
    progress_date DATE      NOT NULL,
    avg_score     DOUBLE    NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_progress_history_user_date (user_id, progress_date),
    KEY idx_student_progress_history_user_id (user_id),
    CONSTRAINT fk_student_progress_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_task_attention_events (
    id               INT          NOT NULL AUTO_INCREMENT,
    user_id          INT          NOT NULL,
    lesson_id        INT          NOT NULL,
    task_id          INT          NOT NULL,
    task_type        VARCHAR(64)  NOT NULL,
    switch_count     INT          NOT NULL DEFAULT 0,
    last_switched_at TIMESTAMP    NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_task_attention (user_id, lesson_id, task_id, task_type)
);

CREATE INDEX idx_user_task_attention_user_lesson
    ON user_task_attention_events (user_id, lesson_id);
