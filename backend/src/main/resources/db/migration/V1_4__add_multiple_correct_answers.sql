ALTER TABLE choose_tasks
    ADD COLUMN correct_answers TEXT NULL AFTER correct_answer;

UPDATE choose_tasks
SET correct_answers = CONCAT('[', correct_answer, ']')
WHERE correct_answers IS NULL;

ALTER TABLE choose_tasks
    MODIFY correct_answers TEXT NOT NULL;

ALTER TABLE write_tasks
    ADD COLUMN correct_answers TEXT NULL AFTER correct_answer;

UPDATE write_tasks
SET correct_answers = JSON_ARRAY(correct_answer)
WHERE correct_answers IS NULL;

ALTER TABLE write_tasks
    MODIFY correct_answers TEXT NOT NULL;

ALTER TABLE scatter_tasks
    ADD COLUMN correct_answers TEXT NULL AFTER correct_answer;

UPDATE scatter_tasks
SET correct_answers = JSON_ARRAY(correct_answer)
WHERE correct_answers IS NULL;

ALTER TABLE scatter_tasks
    MODIFY correct_answers TEXT NOT NULL;

ALTER TABLE speak_tasks
    ADD COLUMN expected_texts TEXT NULL AFTER expected_text;

UPDATE speak_tasks
SET expected_texts = JSON_ARRAY(expected_text)
WHERE expected_texts IS NULL;

ALTER TABLE speak_tasks
    MODIFY expected_texts TEXT NOT NULL;
