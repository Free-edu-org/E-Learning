# Zadania do Jiry na dokończenie projektu FreeEdu

Poniższa lista zawiera czysto techniczne, konkretne zadania developerskie niezbędne do zaimplementowania logiki i widoków opisanych w SWS. Zadania jasno określają zakres prac technicznych, powody ich wdrożenia oraz warstwę technologiczną.

---

## 🏗️ Baza Danych i Architektura

### 1. Rozbudowa schematu bazy danych (Migracja struktury lekcji i zadań)
**Komponent:** BACKEND, BAZA DANYCH
**Po co to robimy:** 
Obecne tabele zadań (np. `choose_tasks`, `speak_tasks`) nie uwzględniają podziału na sekcje dydaktyczne oraz nie mają kolumn na wyświetlanie podpowiedzi. Przede wszystkim brakuje jednak miejsca na zapis metadanych całego "podejścia" ucznia do lekcji – niezbędnego m.in. do mierzenia czasu oraz blokowania możliwości wielokrotnego rozwiązywania zadań po ich zatwierdzeniu.

**Co trzeba zrobić:**
- Przygotować nowy skrypt migracyjny Flyway.
- Dodać kolumnę na wskazówkę dydaktyczną oraz sekcję.
- Stworzyć tabelę `user_lessons` do zapisu metadanych rozwiązywania lekcji.

**Szczegóły techniczne:**
- Należy dodać plik `V1_4__update_lessons_and_tasks.sql` w `backend/src/main/resources/db/migration`.
- Skrypt musi zawierać `ALTER TABLE` dla: `speak_tasks`, `choose_tasks`, `write_tasks`, `scatter_tasks` i dodać kolumny `hint TEXT DEFAULT NULL` i `section VARCHAR(100) DEFAULT NULL`.
- Skrypt budujący `user_lessons` musi definiować klucze obce referujące do `users(id)` oraz `lessons(id)`: `CREATE TABLE user_lessons (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, lesson_id INT NOT NULL, status VARCHAR(20) NOT NULL, score INT, max_score INT, started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, finished_at TIMESTAMP NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE)`.
- W Javie odpowiednio zamapować nową tabelę z użyciem `@Entity` (`UserLesson`) oraz relacjami `@ManyToOne`.

---

## ⚙️ Backend (API & Logika biznesowa)

### 2. Implementacja punktów końcowych (CRUD) dla zawartości lekcji (Zadania)
**Komponent:** BACKEND
**Po co to robimy:** 
Z poziomu frontendu nauczyciel musi mieć możliwość tworzenia faktycznej treści nauczania, czyli dodawania konkretnych zadań wpinanych pod wygenerowane główne id lekcji.

**Co trzeba zrobić:**
- Zbudować pełne kontrolery i serwisy dla dodawania nowych encji typu Zadania.
- Zabezpieczyć autoryzacje i walidację poprawności dodawanych danych (np. aby zadanie nie mogło dostać się do bazy z pustym polem rozwiązania).

**Szczegóły techniczne:**
- Przygotowanie konkretnych DTO Request i Response w Spring Boot z użyciem `jakarta.validation` (`@NotBlank`, `@NotNull`, `@Min(0)` dla punktacji).
- Zastosowanie path variables w schemacie restowym, np. `@PostMapping("/api/v1/lessons/{lessonId}/tasks/speak")`. Wymagane użycie `@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")`.
- Na poziomie Service zaimplementowanie obsługi błędu przy próbie dotarcia do nieistniejącej lekcji za pomocą `LessonRepository.findById(...)` skutkującej wyrzuceniem customowego wyjątku (przechwytywanego przez `@ControllerAdvice`).

### 3. Silnik sprawdzający rozwiązania i zapisujący wynik (Submit)
**Komponent:** BACKEND
**Po co to robimy:** 
Aplikacja ma całkowicie odciążyć nauczyciela od sprawdzania. Backend musi przyjąć zbiór rozwiązań wysłanych przez ucznia z frontendu, porównać je z bazą danych i dokonać oceny.

**Co trzeba zrobić:**
- Napisać logikę sprawdzającą dla przesłanej lekcji.
- Obliczyć punkty uzyskane na każdym zadaniu i wygenerować ostateczny wynik ucznia w lekcji.
- Zmienić u ucznia status wykonywania lekcji na ukończoną z nowym wynikiem.

**Szczegóły techniczne:**
- Endpoint wywoływany przez ucznia na zasadzie `POST /api/v1/lessons/{id}/submit`. DTO powinno zawierać listę odpowiedzi w obiektach (wskazujących na `taskId`, `taskType` oraz `answer` typu String).
- Serwis ewaluacyjny porównuje stringi (z użyciem normalizacji: `.trim().equalsIgnoreCase()`). Do każdego taska tworzy instancję `@Entity` relacyjnej do tabeli `user_answers` i ustawia zwalidowaną logiczną flagę bool `isCorrect`.
- Oznaczanie lekcji załatwione zostaje poprzez zmianę na obiekcie `UserLesson` pobranym wcześniej przez `UserLessonRepository.findByUserIdAndLessonId(...)` i wyznaczenie statusu `COMPLETED`, osadzenie `finished_at = LocalDateTime.now()` i sumy punktów, które następnie są nadpisywane w bazie przez transakcyjność (`@Transactional`).

### 4. API zarządzania blokadami i odblokowywaniem lekcji dla uczniów
**Komponent:** BACKEND
**Po co to robimy:** 
Zgodnie z wymogami SWS uczeń robi lekcję na ocenę tylko raz (brak powrotów). Nauczyciel musi mieć jednak metodę ewakuacyjną (uruchomić endpoint do odblokowywania), by móc zresetować podejście ucznia do lekcji w ramach poprawy.

**Co trzeba zrobić:**
- Logiczne zablokowanie pobierania lekcji.
- Własność serwisu pozwalająca nauczycielowi zresetować postęp w `user_lessons`.

**Szczegóły techniczne:**
- Modyfikacja endpointu pobierania zadań w ucznia – w Service musi znajdować się `if(userLessonRepository.existsByUserIdAndLessonIdAndStatus(userId, lessonId, "COMPLETED"))`, jeśli tak – zwracany jest Exception lub specyficzny status.
- Budowa endpointu administracyjnego `@PostMapping("/api/v1/lessons/{lessonId}/users/{userId}/reset")`.
- Metoda wykonuje procedurę `userAnswerRepository.deleteByUserIdAndLessonId(userId, lessonId)` i usuwa lub całkowicie zrzuca status na 'IN_PROGRESS' z wiersza docelowej sesji w `user_lessons`.

### 5. API do konfigurowania grup, dodawania uczniów i publikacji lekcji
**Komponent:** BACKEND
**Po co to robimy:** 
Aplikacja e-learningu bazuje na organizacyjnej jednostce "grupy". Uczeń jest klasyfikowany logicznie, a lekcja musi być udostępniana globalnie wybranym grupom, ucinając ręczną rejestrację co uczeń po uczniu.

**Co trzeba zrobić:**
- Wystawienie wszystkich interfejsów CRUD modyfikujących zespoły.
- Operacyjna modyfikacja skojarzeń uczeń-grupa i lekcja-grupa w mapperach.

**Szczegóły techniczne:**
- Rozbudowa kontrolerów z użyciem Spring WebFlux do modyfikacji tabel `user_groups`.
- Specyficzny punkt wejściowy np. `POST /api/v1/groups/{groupId}/users` przyjmujący `@RequestBody List<Integer> userIds` służący dodaniu rekordów do `user_in_group`. Należy zadbać o obejście konfliktów związanych z warunkiem UNIQUE (`user_id, group_id`).
- Dodanie integracji dla wyświetlania dashboardu ucznia: przy zapytaniu `GET /api/v1/lessons/available` backend odpytuje repozytorium tylko poprzez JOINa pobierającego przypisane do grup ucznia lekcje z doczepioną flagą "czyZrobiona".

### 6. Bezpieczeństwo - Endpointy do interwencyjnego resetowania haseł i zmian w profilu
**Komponent:** BACKEND
**Po co to robimy:** 
Podstawowy self-service konta dla ucznia oraz mechanizm interwencyjny dla nauczyciela do nadawania tymczasowych haseł w kryzysowych momentach dla klasy.

**Co trzeba zrobić:**
- System pozwalającny użytkownikowi nadpisanie hasła z użyciem znajomości starego elementu hasła.
- Punkt przywracający dla roli nauczyciela z pominięciem uwierzytelniania na konto docelowe.

**Szczegóły techniczne:**
- Metoda ucznia w `UserController`: `changeUserPassword` korzystająca z podpiętego bean'a `PasswordEncoder`. Weryfikowana jest wpierw poprawność `passwordEncoder.matches(oldPassword, user.getPassword())`. Hasło następnie jest haszowane z powrotem funkcją `encode()`.
- Metoda dla nauczyciela na endpoincie `POST /api/v1/users/{studentId}/teacher-reset`. Zastosowane `@PreAuthorize("hasRole('TEACHER')")`. W Spring Service wykorzystanie generatora pseudolosowego wbudowanego Random/SecureRandom generującego np. 8 znakowy ciąg (lub UUID). Nowy wynik zostaje na surowo zwrócony w klasie `ResetStatusDto`, a jego zhaszowany wariant leci przez setter do bazy.

### 7. Integracja lokalnego mikroserwisu AI (Whisper STT) przy ułożeniu zadań dźwiękowych
**Komponent:** BACKEND, SERWIS ZEWNĘTRZNY HTTP
**Po co to robimy:** 
Wspieranie poprawnej wymowy ucznia przez nagrywki dźwiękowe wymaga odpytania wyspecjalizowanego skryptu z modelem Voice. Spring zyskuje rolę mostu autoryzującego pakiet do zewnętrznego mikroserwisu.

**Co trzeba zrobić:**
- Zbudowanie połącznia HTTP celem rzutu multipart audio z Springa do serwera operacyjnego z Pythonem.
- Skłonności oceniające otrzymany string zwrotny pod kątem poprawności z wymaganym wyrazem z testu.

**Szczegóły techniczne:**
- Zbudowanie serwisu integrującego, np. z użyciem `WebClient` ze Spring WebFlux (asynchronicznie) rzucając POST do stt-service postawionego np. na localhost:8000.
- Odebranie bloku w endpoincie `@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)`. Model wejściowy kontrolera korzysta z typu `FilePart` (Reaktywny Spring) dla pliku audio. 
- Transkrypcje przyjmowane z serwisu AI poddawane są znormalizowaniu (usunięcie dziwnej interpunkcji modelem regex i transformacja lowerCase), aby ułatwić i zabezpieczyć procedurę `String#equals` nad kluczem.

---

## 🖥️ Frontend (Widoki i Interfejs Użytkownika)

### 8. Widok rozwiązywania i inteligentnej ewaluacji lekcji (Strona Ucznia)
**Komponent:** FRONTEND, UI (React + MUI)
**Po co to robimy:** 
Uczeń potrzebuje interfejsu (SPA) do sprawnego przejścia przez cały test i otrzymania po nim jasnej, ładnej graficznie wizualizacji poprawrności.

**Co trzeba zrobić:**
- Mechanika Paginacji dla testu per "sekcja".
- Komponenty obsługujące wprowadzanie odpowiedzi dla różnych wariantów zadania.
- Interfejs po zakończeniu - ekran z wynikami i wyświetlane podświetlenia (błąd/sukces).

**Szczegóły techniczne:**
- Utworzenie trasowania (routingu) za pomocą pakietu `react-router-dom` w Vite. Implementacja komponentów "Stateful" agregujących wpisane na klawiaturze odpowiedzi np. przy użyciu struktury map w state React Hooks (lub stan w globalnym menedżerze, jeśli jest podbity reduktor stanu).
- Użycie interfejsu wbudowanych przeglądarek `MediaRecorder API`, pozwalającego na rejestrację komponentu mikrofonu do elementu HTML z opcją na `blob:audio/wav`, zapinając na to element POST z FormData.
- Po udanym wycallowaniu API `/submit` następuje przejście routerem do widoku wyników, używając komponentów z `@mui/material` np. `Alert` wariantów success/error z kolorystyką jasno opartą o status z API z użyciem templingowych conditionali `isCorrect ? 'green' : 'red'`.

### 9. Panele zarządcze CMS dla Nauczyciela (Kreator lekcji, grupy i statystyki metryczne)
**Komponent:** FRONTEND, UI (React + MUI + ChartLib)
**Po co to robimy:** 
Zarządzanie kontentem z backendu będzie możliwe do "wyklikania", w formacie przypominającym nowoczesne Google Classroom do wglądu dla nauczyciela.

**Co trzeba zrobić:**
- Interaktywny deweloper materiałów (Kreator dodwania wielu lekcji i pytań na raz na froncie).
- Konsolidacja logistyki widoku ucznia w siatce CRUD dla grupy.
- Widok na wykresy postępów generujący na bieżąco linijkę poprawy procentów z odbytymi zajęciami.

**Szczegóły techniczne:**
- Reactowe kontrolery bazujące na dynamicznych tablicach stanów do tworzenia zadań (np. wywołanie metody w komponencie `addTaskBtn` na stałym froncie dolepia element `<TaskForm/>` bez przeładowywania domeny).
- Ekran logistyki polegać będzie w 100% z wykorzystania tablic (MUI `Table` i `TablePagination`). Akcje na wierszach do otwierania `@mui/material/Modal` używanego do nadawania interwencyjnych haseł per uczeń.
- Ściągnięcie bilbioteki typu `recharts` / `chart.js` w zależności od konwencji projektowych i spakowanie tam metryki z osi Y `score/max_score * 100` ze znacznikiem czasowym ze stringowego date (x-axis) z backendu u danego ucznia (ID podane w propsach i wywołane w `useEffect`).

### 10. Przestrzeń profilowa i elementy lojalnościowo-grywalizacyjne. 
**Komponent:** FRONTEND, UI (React + MUI)
**Po co to robimy:** 
Użytkownik końcowy potrzebuje mechanizmów motywujących do dalszej pracy i przestrzeni do edycji swoich detali z powieszeniem zdefiniowanej wygody obsługi konta.

**Co trzeba zrobić:**
- Profil z opcją podmiany hasła.
- Implementacja paneli prezentująca zebrane ze strony logiki odznaki z nagrodą.

**Szczegóły techniczne:**
- Integracja komponentów formularza `TextField` pod maską wertykalnego widoku opatrzonego hookiem `useActionState`/`useState` dla zarządzania polami do kontroli oldPassword, newPassword z validacją frontową na długość znaków.
- Fetch na profil odpalający w `useEffect` metodę ładującą kolekcję Odznak pobraną bazodanowo w `fetchUserAchievements()` w celu wyrenderowania komponentów list/grid z zarysami SVG medalowych odznak.
- Wyprowadzenie stałego modułu pokazującego przy zdjęciu użytkownika jego licznik z punktami powiązany z autoryzowaną z backendu zliczanką odnawiającą się warunkowo kontekstem logowania.
