# Szczegółowe wyniki lekcji dla nauczyciela i ucznia

**Cel zadania:** dodać pełny widok szczegółowych wyników lekcji, tak aby nauczyciel mógł wejść w wynik konkretnego ucznia dla konkretnej lekcji i zobaczyć każde zadanie wraz z odpowiedzią ucznia, poprawną odpowiedzią i statusem poprawności, a uczeń mógł zobaczyć trwały widok szczegółów swojej ukończonej lekcji po zakończeniu rozwiązywania.

#### Zarys aktualnej architektury względem zadania
- **Co jest (obecny stan):**
  - Backend zapisuje odpowiedzi użytkownika per zadanie w tabeli `user_answers` (`task_id`, `task_type`, `user_id`, `lesson_id`, `answer`, `is_correct`, `created_at`).
  - Backend zapisuje agregat wyniku lekcji w tabeli `user_lessons` (`status`, `score`, `max_score`, `finished_at`).
  - Endpoint `POST /api/v1/lessons/{lessonId}/submit` zwraca jednorazowo wynik bieżącego submitu z listą `details`, ale tylko w kontekście kończenia lekcji.
  - Endpoint `GET /api/v1/teacher/lessons/{lessonId}/stats` zwraca nauczycielowi wyłącznie agregaty per uczeń: `score`, `maxScore`, `resultPercent`, `completedAt`.
  - Frontend nauczyciela pokazuje listę uczniów i procenty w `LessonStatsView`, bez wejścia w szczegóły odpowiedzi dla danej lekcji.
  - Frontend ucznia pokazuje po submit jedynie prosty dialog wyniku, bez trwałego ekranu historii ukończonej lekcji.
- **Czego brakuje:**
  - Brakuje endpointu odczytowego zwracającego szczegóły wyniku lekcji dla wskazanego użytkownika i lekcji.
  - Brakuje DTO łączącego definicję zadania z zapisaną odpowiedzią użytkownika.
  - Brakuje widoku nauczyciela typu „szczegóły wyniku ucznia w lekcji”.
  - Brakuje widoku ucznia pozwalającego po czasie wrócić do ukończonej lekcji i zobaczyć szczegółowy wynik.
  - Brakuje rozdzielenia uprawnień dla odczytu takich danych: nauczyciel-owner lekcji, sam uczeń, admin.
- **Ryzyka / ograniczenia:**
  - Aktualnie `GET /api/v1/lessons/{lessonId}/tasks` dla ucznia zwraca `LESSON_ALREADY_COMPLETED`, więc nie nadaje się do wyświetlenia read-only ukończonej próby.
  - Sam zapis `user_answers.answer` przechowuje odpowiedź użytkownika, ale obecne DTO submitu nie zwraca jej w odpowiedzi.
  - Dane zadania są rozproszone po tabelach `choose_tasks`, `write_tasks`, `scatter_tasks`, `speak_tasks`, więc szczegóły wyniku wymagają złożenia odpowiedzi z definicją zadania per typ.
  - Należy pilnować ownership, aby nauczyciel nie widział wyników cudzej lekcji ani cudzych uczniów spoza swojej relacji domenowej.
- **Zakres implementacji:**
  - Dodać odczyt szczegółowego wyniku lekcji.
  - Udostępnić go nauczycielowi i uczniowi przez osobne, jasno autoryzowane flow.
  - Rozszerzyć frontend o ekran/listę zadań z odpowiedzią użytkownika, poprawną odpowiedzią i oznaczeniem błędu.
  - Zaktualizować kontrakt API i testy.

#### 1. Zmiany w bazie danych
- **Tabele / relacje:**
  - Na ten moment nie ma twardej potrzeby dodawania nowych tabel, ponieważ `user_answers` i `user_lessons` przechowują minimalny wymagany stan do odczytu szczegółów wyniku.
  - Należy potwierdzić, czy obecny model `user_answers.answer` wystarcza dla wszystkich typów zadań, w szczególności `choose`, `scatter`, `speak`.
- **Migracje:**
  - Jeśli w trakcie implementacji okaże się, że potrzebne są dodatkowe pola prezentacyjne lub metadane audytowe, dodać osobną migrację. W bazowym wariancie zadanie można zrealizować bez migracji.

#### 2. API / kontrakt
- **Endpointy:**
  - Dodać endpoint do pobrania szczegółowego wyniku lekcji dla nauczyciela, np. `GET /api/v1/teacher/lessons/{lessonId}/students/{userId}/result`.
  - Dodać endpoint do pobrania szczegółowego wyniku ukończonej lekcji dla ucznia, np. `GET /api/v1/student/lessons/{lessonId}/result`.
  - Alternatywnie można dodać jeden wspólny endpoint na warstwie `lessons`, ale z precyzyjną autoryzacją i rozróżnieniem perspektywy. Preferowane są jednak dwa jawne entrypointy BFF.
- **Request / response:**
  - Response powinien zawierać dane nagłówkowe lekcji i użytkownika oraz listę szczegółów per zadanie.
  - Proponowany response:
    - `lessonId`
    - `lessonTitle`
    - `userId`
    - `username`
    - `score`
    - `maxScore`
    - `resultPercent`
    - `completedAt`
    - `tasks[]`, gdzie każdy element zawiera:
      - `taskId`
      - `taskType`
      - `section`
      - `taskText`
      - `hint` lub `null`
      - `userAnswer`
      - `correctAnswer`
      - `isCorrect`
      - opcjonalnie `possibleAnswers` dla `choose`
      - opcjonalnie `words` dla `scatter`
  - Dla nauczyciela i ucznia response może mieć ten sam shape.
- **Auth / authz / ownership:**
  - `TEACHER`: tylko owner lekcji i tylko dla ucznia powiązanego domenowo z tą lekcją.
  - `STUDENT`: tylko własny wynik, tylko dla ukończonej lekcji.
  - `ADMIN`: pełny dostęp.
  - Weryfikacja nie może opierać się wyłącznie na `user_answers`, tylko również na relacji lesson-owner / student-access.
- **Error codes:**
  - `LESSON_NOT_FOUND` jeśli lekcja nie istnieje.
  - `USER_NOT_FOUND` lub dedykowany kod, jeśli wskazany uczeń nie istnieje.
  - `FORBIDDEN` / `NOT_LESSON_OWNER` przy braku ownership po stronie nauczyciela.
  - `STUDENT_NO_ACCESS` lub dedykowany kod, jeśli nauczyciel próbuje odczytać wynik użytkownika niepowiązanego z lekcją.
  - `LESSON_RESULT_NOT_FOUND` jeśli brak ukończonej próby dla user+lesson.

#### 3. Backend
- **Moduły / serwisy / repozytoria:**
  - Dodać serwis odpowiedzialny za złożenie szczegółowego wyniku z `user_answers`, `user_lessons` i definicji zadań.
  - Wykorzystać istniejące `UserAnswerRepository.findByUserIdAndLessonId(...)` i `UserLessonRepository.findByUserIdAndLessonId(...)`.
  - Dodać logikę mapowania odpowiedzi na realne zadania z tabel `choose_tasks`, `write_tasks`, `scatter_tasks`, `speak_tasks`.
  - Rozszerzyć controller nauczyciela i controller studenta o endpointy result-details.
- **Walidacja i logika biznesowa:**
  - Zwracać wyłącznie ukończone wyniki lekcji.
  - Uporządkować listę zadań w stabilnej kolejności prezentacyjnej.
  - Dla `choose` zwracać zarówno indeks/klucz poprawnej odpowiedzi, jak i listę wariantów, aby frontend mógł pokazać, co użytkownik zaznaczył.
  - Dla `scatter` i `write` zwracać literalnie odpowiedź użytkownika i poprawną odpowiedź.
  - Dla `speak` na ten moment zwracać zapisane `answer` z submitu oraz `expectedText` jako poprawną odpowiedź. Jeśli produkt oczekuje także pełnych danych STT per słowo, to jest osobny gap, bo dziś nie są trwale zapisywane.
  - Jeśli część historycznych rekordów nie ma pełnej zgodności z aktualnym zadaniem, zdefiniować fallback lub zwrócić jawny brak danych zamiast 500.

#### 4. Frontend
- **Widoki / flow / integracja API:**
  - Dodać widok nauczyciela dla szczegółowego wyniku ucznia w ramach lekcji, dostępny z `LessonStatsView`.
  - Zmienić CTA z ogólnego „Zobacz profil” na akcję prowadzącą do szczegółów wyniku tej konkretnej lekcji, albo dodać osobny przycisk „Zobacz szczegóły”.
  - Widok powinien pokazywać:
    - nagłówek z uczniem, lekcją, procentem i punktami,
    - listę zadań,
    - dla każdego zadania treść, odpowiedź ucznia, poprawną odpowiedź i status poprawne/błędne.
  - Dodać widok ucznia dla ukończonej lekcji w trybie read-only.
  - Po zamknięciu dialogu wyniku uczeń powinien móc wrócić później do szczegółów z listy swoich lekcji albo z dedykowanej nawigacji.
  - Rozszerzyć warstwę API frontendowego o nowe typy response i metody fetchujące wynik szczegółowy.

#### 5. Testy i walidacja
- **Testy backendowe / API / frontendowe:**
  - Testy serwisu backendowego dla poprawnego złożenia szczegółów wyniku dla wszystkich typów zadań.
  - Testy uprawnień:
    - nauczyciel-owner widzi wynik,
    - obcy nauczyciel nie widzi wyniku,
    - uczeń widzi tylko własny wynik,
    - admin widzi wynik.
  - Testy przypadku braku wyniku dla user+lesson.
  - Testy kontraktu API dla nowych endpointów.
  - Testy frontendowe renderowania listy zadań z poprawną i błędną odpowiedzią.
- **Cleanup danych testowych:**
  - Jeśli będą dodawane testy integracyjne/API na współdzielonej bazie developerskiej, trzeba usuwać rekordy `user_answers` i `user_lessons` po testach albo tworzyć izolowane dane testowe.

#### Kryteria akceptacji
- Nauczyciel z poziomu wyników lekcji może wejść w szczegóły konkretnego ucznia.
- W szczegółach nauczyciel widzi każde zadanie z tej lekcji, odpowiedź ucznia, poprawną odpowiedź i status poprawności.
- Uczeń może otworzyć szczegóły swojej ukończonej lekcji po czasie, bez możliwości ponownego submitu.
- Endpointy są zabezpieczone zgodnie z ownership i rolami.
- `api-contract.md` jest zaktualizowany o nowe endpointy i response.
- Implementacja jest pokryta testami backendowymi i nie psuje obecnego flow submitu oraz statystyk.

#### Notatka implementacyjna
- To zadanie nie wymaga zmiany istniejącego modelu oceniania. Główny brak dotyczy warstwy odczytu i prezentacji danych już zapisanych podczas submitu.
- Ewentualne rozszerzenie o trwałe przechowywanie szczegółów STT per słowo dla `speak` należy traktować jako osobne zadanie, jeśli produkt tego oczekuje.
