-- Użytkownicy (Hasła powinny być haszowane, tu są tekstem jawnym dla przykładu)
INSERT INTO users (email, username, password, role) VALUES
    ('admin@szkola.pl', 'admin_marek', 'secret123', 'admin'),
    ('student1@edu.pl', 'jan_kowalski', 'student789', 'student'),
    ('student2@edu.pl', 'anna_nowak', 'pass456', 'student');

-- Grupy
INSERT INTO user_groups (name, description) VALUES
    ('Angielski A1', 'Grupa początkująca - semestr letni'),
    ('Angielski B2', 'Grupa średniozaawansowana - przygotowanie do certyfikatu');

 -- Osiągnięcia (achievements)
INSERT INTO achievements (name, description) VALUES
    ('Pierwsze kroki', 'Ukończono pierwszą lekcję'),
    ('Szybki pisarz', 'Rozwiązano zadanie typu Write w mniej niż 10 sekund'),
    ('Perfekcjonista', 'Uzyskano 100% poprawnych odpowiedzi w lekcji');

-- Lekcje
INSERT INTO lessons (title, theme, is_active) VALUES
    ('Powitania', 'Podstawowe zwroty grzecznościowe', TRUE),
    ('Czasowniki', 'Czas Present Simple', TRUE);

-- Zadania: Wybór (choose_tasks)
INSERT INTO choose_tasks (lesson_id, task, possible_answers, correct_answer) VALUES
    (1, 'Jak powiesz "Dzień dobry" rano?', '1. Good night, 2. Good morning, 3. Hello', 2),
    (2, 'Wybierz poprawną formę: He ___ to school.', '1. go, 2. goes, 3. going', 2);

-- Zadania: Pisanie (write_tasks)
INSERT INTO write_tasks (lesson_id, task, correct_answer) VALUES
    (1, 'Przetłumacz na angielski: "Cześć"', 'Hello'),
    (2, 'Wpisz przeczenie: I ___ not like apples.', 'do');

-- Zadania: Rozsypanka (scatter_tasks)
INSERT INTO scatter_tasks (lesson_id, task, words, correct_answer) VALUES
    (1, 'Ułóż zdanie: am, I, John', 'am;I;John', 'I am John');

-- Przypisanie użytkowników do grup (user_in_group)
INSERT INTO user_in_group (user_id, group_id) VALUES
    (2, 1), -- Jan w grupie A1
    (3, 1); -- Anna w grupie A1

-- Przypisanie lekcji do grup (group_has_lesson)
INSERT INTO group_has_lesson (group_id, lesson_id) VALUES
    (1, 1), -- Grupa A1 ma lekcję "Powitania"
    (1, 2); -- Grupa A1 ma lekcję "Czasowniki"

-- Odpowiedzi użytkowników (user_answers)
INSERT INTO user_answers (task_id, user_id, lesson_id, answer, is_correct) VALUES
    (1, 2, 1, 'Good morning', TRUE),
    (1, 2, 1, 'Helo', FALSE); -- Literówka w odpowiedzi

-- Przyznane osiągnięcia (user_get_achivment)
INSERT INTO user_get_achievement (user_id, achievement_id) VALUES
    (2, 1); -- Jan otrzymał odznakę "Pierwsze kroki"