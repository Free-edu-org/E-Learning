---
description: [zasady kodowania FreeEdu - zawsze stosuj w projekcie]
---

# Zasady deweloperskie i architektoniczne dla projektu FreeEdu - Wytyczne dla Antigravity

Zbiór nadrzędnych instrukcji definiujących, w jaki sposób jako asystent pracuję z kodem FreeEdu, by utrzymać narzucony przez Was wzorzec i zapewnić czystość projektu bez zbytecznych plików i refaktoryzacji, o którą nie było prośby.

## 1. Kodowanie Backendu (Java & Spring Boot)

### Struktura logiczna i nazewnictwo (Pakiet `pl.freeedu.backend`):
- **Wzorzec Warstwowy:** Kod bezwzględnie rygorystycznie należy dzielić na warstwy: `Controller` -> `Service` -> `Repository`. Nigdy nie wykonuj zapytań bazodanowych ani logiki biznesowej bezpośrednio w kontrolerach.
- **Enity i Baza Danych:** Wszystkie tabele zarządzane we Flyway (`resources/db/migration`). Każda zmiana struktury bazy wymaga nowego pliku `V<X>_<Y>__nazwa_migracji.sql`. Nigdy nie edytuj wcześniej puszczonych plików migracji po za deweloperskim rollbackiem.
- **DTOs:** Komunikacja API wyłącznie przez Data Transfer Objects z pakietu `dto`. Nigdy nie zwracaj ani nie przyjmuj obieków `@Entity` bezpośrednio z / do klienta. Narzucaj walidację używając paczki `jakarta.validation` (`@NotNull`, `@NotBlank`, itp.).
- **Obsługa Błędów:** W kontrolerach używaj wyjątków i łap je globalnie, nie zwracaj ręcznie statusów z instrukcjami wewnątrz serwisów (używaj `GlobalExceptionHandler` korzystający np. z `@ControllerAdvice`). Szanuj typ wyjątków typu `ResourceNotFoundException`.
- **Minimalizm zmian:** Edytuj tylko te pliki, które ewidentnie są celem taska. Zawsze sprawdzaj, czy dana metoda/helpernie istnieje już w aktualnych plikach klasy pobocznie (DRY).

### Operacje bazodanowe:
- Korzystaj ze **Spring Data JPA**. Metody pomocnicze wydzielaj w `Repository` jako metody zadeklarowane z nazw, np. `findByUserIdAndLessonId(...)`.
- Transakcje: Każdy proces zapisujący i oceniający wiele encji jednocześnie (np. Submity zadań ucznia) **MUSI** mieć adnotację `@Transactional` na poziomie Serwisu.

### Bezpieczeństwo i Autoryzacja:
- Kod polega na Spring Security. Wszystkie endpointy należy bronić deklaratywnie, np. używając `@PreAuthorize("hasRole('TEACHER')")`. Weryfikuj prawa własności u użytkownika bezpośrednio w logice serwisu, czerpiąc z jego Tokenu via `SecurityContextHolder`.

---

## 2. Kodowanie Frontendu (React 19 & Vite & TS)

### Struktura komponentów (`src/`):
- Aplikacja podzielona na logiczne funkcje - Feature-based architecture (katalogi `features/`, np. `features/lessons`, `features/tasks`).
- Trzymaj się wyznaczonego ułożenia: wywołania z użyciem API umieszczaj w paczce `api/` (korzystając z Fetch/Axios), by oddzielić je od widoku.
- Współdzielone elementy graficzne trzymaj w katalogu `components/`, a dane konfiguracyjne i autoryzację w `context/`.

### Biblioteki widoku (MUI v7+):
- **Material UI:** Interfejs jest zasilony biblioteką `@mui/material`. Nie twórz i nie wyciągaj natywnego CSS/HTML jeżeli do danego rozwiązania istnieje gotowy komponent z MUI (np. `Box`, `Button`, `TextField`, `Card`, `Modal`). Utrzymuj design system oparty o domyślny lub zastany Theme.
- Stronnictwo (Routing) załatwiamy paczką `react-router-dom`. Dla asynchronicznych modyfikacji preferuj `useNavigate`. Dedykuj trasy jako odseparowane od siebie komponenty.

### Praktyki JS/TS:
- Typowanie to mus - pisz jednoznaczne interfejsy `interface` bądź `type` na górze pliku dla wszystkich struktur danych wracających z Springa. 
- Obsługuj stany ładowania (`isLoading` / `Spinner`) i błędów (`error` object / `Snackbar`), by frontend zachowywał się przewidywalnie podczas oczekiwania na żądania, i przestań renderować mocki dla już stworzonych i połączonych end-pointów z Backendem.

---

## 3. Złote Reguły Współpracy dla AI:
1. **Zawsze stawiaj mniejsze kroki:** Nie przerabiaj kilkunastu plików naraz. Rozbuduj funkcjonalność precyzyjnie wykonując najpierw schemat danych z SQL'a, potem API backendu za jedną edycją, a na koniec odrębnie pracuj nad Frontendowym oknem.
2. **Kompensacja (Nie łam tego, co działa):** Podczas pracy dopisuj rzeczy na spodzie, zachowując starsze metody kontrolerów jeżeli użytkownik nie żądał specyficznie ich usunięcia.
3. **Nie wymyślaj kółka na nowo:** Kiedy użytkownik prosi o nowy endpoint albo widok React - sprawdź najpierw plik z aktualnymi endpointami i widokami aby pobrać konwencje logowania, uwierzytelniania, oraz kolorów, cieniowania i gridów UI, zamiast tworzyć sztywny kod odizolowany od spójnego obrazu marki FreeEdu.
