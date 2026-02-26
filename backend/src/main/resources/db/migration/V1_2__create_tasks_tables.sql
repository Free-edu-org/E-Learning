CREATE TABLE speak_tasks (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    task TEXT NOT NULL
);

CREATE TABLE choose_tasks (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    possible_answers TEXT,
    correct_answer INT
);

CREATE TABLE write_tasks (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    correct_answer TEXT
);

CREATE TABLE scatter_tasks (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    words TEXT,
    correct_answer TEXT
);
