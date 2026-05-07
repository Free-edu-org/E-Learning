-- Użytkownicy (Hasła powinny być haszowane, tu są tekstem jawnym dla przykładu)
INSERT INTO users (email, username, password, role) VALUES
    ('admin@szkola.pl', 'admin_marek', '$2a$10$E76vPLy8/fTJ36cpmvYNBOGKxUB72aTb7rexqJgvHIuaQLE4vS1KC', 'ADMIN'),
    ('student1@edu.pl', 'jan_kowalski', '$2a$10$EfQqseEyw46zbJW75uREjeFG.SG5XK/OtIKrmxHMr0xyCmgS3N5f.', 'STUDENT'),
    ('student2@edu.pl', 'anna_nowak', '$2a$10$KisRc079EPu5z5uFOV80m.h7jxAnUsJJStyNCR.Tiq.u/Z6s1cTCq', 'STUDENT'),
    ('teacher@szkola.pl', 'pan_tomasz', '$2a$10$E76vPLy8/fTJ36cpmvYNBOGKxUB72aTb7rexqJgvHIuaQLE4vS1KC', 'TEACHER');

-- Grupy
INSERT INTO user_groups (name, description, teacher_id) VALUES
    ('Angielski A1', 'Grupa początkująca - semestr letni', 4),
    ('Angielski B2', 'Grupa średniozaawansowana - przygotowanie do certyfikatu', 4);

-- Osiągnięcia (achievements)
INSERT INTO achievements (code, name, description, icon, color, type, threshold, active, sort_order) VALUES
    ('FIRST_LESSON', 'Pierwsza lekcja', 'Ukończyłeś swoją pierwszą lekcję', '', 'warning', 'LESSONS_COMPLETED', 1, TRUE, 10),
    ('AVATAR_CHANGED', 'Nowy avatar', 'Zmieniłeś swój avatar', '', 'info', 'AVATAR_CHANGED', NULL, TRUE, 20),
    ('TEN_POINTS', '10 punktów', 'Zdobyłeś 10 punktów', '⭐', 'success', 'POINTS', 10, TRUE, 30);

-- Lekcje
INSERT INTO lessons (title, theme, is_active, teacher_id) VALUES
    ('Powitania', 'Podstawowe zwroty grzecznościowe', TRUE, 4),
    ('Czasowniki', 'Czas Present Simple', TRUE, 4),
    ('Kolory i zwierzęta', 'Słownictwo podstawowe - kolory, zwierzęta, proste zdania', TRUE, 4);

-- Zadania do lekcji 1 i 2
INSERT INTO choose_tasks (lesson_id, task, possible_answers, correct_answer) VALUES
    (1, 'Jak powiesz "Dzień dobry" rano?', 'Good night|Good morning|Hello', 1),
    (2, 'Wybierz poprawną formę: He ___ to school.', 'go|goes|going', 1);

INSERT INTO write_tasks (lesson_id, task, correct_answer) VALUES
    (1, 'Przetłumacz na angielski: "Cześć"', 'Hello'),
    (2, 'Wpisz przeczenie: I ___ not like apples.', 'do');

INSERT INTO scatter_tasks (lesson_id, task, words, correct_answer) VALUES
    (1, 'Ułóż zdanie: am, I, John', 'am|I|John', 'I am John');

-- Lekcja 3: "Kolory i zwierzęta" - pełna lekcja z sekcjami, hintami i 4 typami zadań
INSERT INTO choose_tasks (lesson_id, task, possible_answers, correct_answer, hint, section) VALUES
    (3, 'What color is the sky?', 'red|blue|green|yellow', 1, 'Pomyśl o pogodnym dniu.', 'Kolory'),
    (3, 'What color is grass?', 'blue|red|green|orange', 2, 'Pomyśl o parku wiosną.', 'Kolory'),
    (3, 'Choose the correct translation of "czerwony":', 'blue|red|yellow|pink', 1, NULL, 'Kolory');

INSERT INTO write_tasks (lesson_id, task, correct_answer, hint, section) VALUES
    (3, 'Przetłumacz na angielski: "żółty"', 'yellow', 'Kolor słońca i bananów.', 'Kolory'),
    (3, 'Jak po angielsku powiemy "czarny"?', 'black', NULL, 'Kolory');

INSERT INTO choose_tasks (lesson_id, task, possible_answers, correct_answer, hint, section) VALUES
    (3, 'Which animal says "meow"?', 'dog|cat|bird|fish', 1, 'To zwierzę domowe, które lubi mleko.', 'Zwierzęta'),
    (3, 'Which animal can fly?', 'cat|fish|bird|dog', 2, 'Ma skrzydła i pióra.', 'Zwierzęta');

INSERT INTO write_tasks (lesson_id, task, correct_answer, hint, section) VALUES
    (3, 'Przetłumacz na angielski: "pies"', 'dog', 'Najlepszy przyjaciel człowieka.', 'Zwierzęta'),
    (3, 'Jak po angielsku powiemy "ryba"?', 'fish', NULL, 'Zwierzęta');

INSERT INTO scatter_tasks (lesson_id, task, words, correct_answer, hint, section) VALUES
    (3, 'Ułóż zdanie z rozsypanki:', 'a|have|I|cat', 'I have a cat', 'Zacznij od "I".', 'Zwierzęta'),
    (3, 'Ułóż zdanie:', 'is|The|big|dog', 'The dog is big', 'Zacznij od "The".', 'Zwierzęta');

INSERT INTO scatter_tasks (lesson_id, task, words, correct_answer, hint, section) VALUES
    (3, 'Ułóż zdanie:', 'blue|The|is|sky', 'The sky is blue', NULL, 'Proste zdania'),
    (3, 'Ułóż poprawne zdanie:', 'like|I|red|color|the', 'I like the red color', 'Zacznij od "I".', 'Proste zdania');

INSERT INTO speak_tasks (lesson_id, expected_text, hint, section) VALUES
    (3, 'The cat is black and the dog is brown', 'Zwróć uwagę na wymowę "brown".', 'Proste zdania'),
    (3, 'I like blue birds and yellow fish', NULL, 'Proste zdania'),
    (3, 'My favorite color is green', 'Słowo "favorite" wymawiamy "fejwryt".', 'Proste zdania');

-- Przypisania
INSERT INTO user_in_group (user_id, group_id) VALUES
    (2, 1),
    (3, 1);

INSERT INTO group_has_lesson (group_id, lesson_id) VALUES
    (1, 1),
    (1, 2),
    (1, 3);

INSERT INTO user_answers (task_id, user_id, lesson_id, answer, is_correct, task_type) VALUES
    (1, 2, 1, 'Good morning', TRUE, 'write_tasks'),
    (1, 2, 1, 'Helo', FALSE, 'write_tasks');
