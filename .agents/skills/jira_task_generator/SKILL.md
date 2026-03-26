---
name: FreeEdu Jira Task Generator
description: Produkuje ustandaryzowane techniczne opisy zadań do Jiry na podstawie analizy SWS i obecnego stanu bazy danych.
---

# FreeEdu Jira Task Generator

Ten skill służy do automatycznego generowania precyzyjnych, technicznych opisów zadań do Jiry dla projektu FreeEdu. Generator opiera się na porównaniu wymagań biznesowych z obecną architekturą bazy danych.

## Kiedy używać
Gdy użytkownik poprosi o przygotowanie opisu na zadanie w Jirze, rozpiskę zadania, specyfikację API lub utworzenie nowego feature'a związanego z backendem lub pełnym stackiem.

## Kroki do wykonania przez model

1. **Analiza SWS (Wymagań):** 
   - Przeszukaj dostępną dokumentację systemową (np. wyciągnięty tekst `tmp_sws.txt` lub sekcje SWS) pod kątem wskazań dla konkretnej funkcji.

2. **Analiza bazy danych:**
   - Sprawdź lokalizację `backend/src/main/resources/db/migration`, aby zweryfikować, czy tabela do tego zadania już istnieje, jakie ma kolumny i jakich powiązań (Foreign Keys) brakuje.

3. **Analiza aktualnej architektury (Przegląd)**
   - Zbadaj obecny kod pod kątem wybranego zadania. Wypisz zwięźle punkt wyjścia projektowego. Określ: co już istnieje, czego brakuje do realizacji celu, co z tej okazji warto poprawić (refactoring), oraz jakie są dodatki "nice to have" (np. mechanika resetu hasła przez system e-mail zamiast tylko wypluwania do klienta).

4. **Formatowanie wyniku:**
   - Wygeneruj opis zadania w języku polskim, kategorycznie przestrzegając poniższego szablonu. Nie pomijaj żadnych istotnych nagłówków.

---

### Szablon zadania na Jira

**Cel zadania:** [Krótki i zwięzły opis z perspektywy biznesowej i technicznej, np. Implementacja logiki X aby wyeliminować mocki i przygotować API]

#### Zarys Aktualnej Architektury Względem Zadania
- **Co jest (Obecny stan):** [Zwięzło wokół tego, w jaki sposób i w jakich plikach funkcja jest obecnie np. zmockowana lub z czego możemy skorzystać przygotowanego w poprzednim sprincie]
- **Co brakuje:** [Krytyczne abstrakcje lub kod którego wcale nie ma i musi zostać docelowo stworzony od zera]
- **Co poprawić (Refactoring):** [Podatności / dług techniczny zaobserwowany przy okazji robienia tego zadania, o który należy zadbać]
- **Nice to have:** [Dodatki niezwiązane ze standardowym SWS/Minimum, ale przydatne edukacyjnie bądź biznesowo - np. zrobienie dwuskładnikowej weryfikacji, generacja PDF z wyniku i reset przez powiadomienie E-mail]

#### 1. Zmiany w Bazie Danych
[Jeśli wymagane są zmiany. Jeśli nie – opisz, z jakich tabel system ma korzystać]
- **[Nazwa tabeli/Akcja]:** [Co dokładnie dodać? np. Tabela `lessons` musi zostać rozszerzona o kolumnę `teacher_id` (FK do `users.id`)]
- **[Relacje/Statusy]:** [Zależności, np. Upewnienie się że is_active poprawnie działa...]

#### 2. Specyfikacja Endpointów (API REST)
[Dla każdego wymaganego punktu końcowego podaj precyzyjne dane]

**A. [Krótka Nazwa Akcji np. Pobieranie listy lekcji]**
- **URL:** [np. GET /api/v1/lessons]
- **Metoda:** [GET | POST | PUT | PATCH | DELETE]
- **Uprawnienia:** [np. TEACHER lub ADMIN]
- **Request Body / Parametry:** [Co aplikacja powinna dostać, np. filtrowanie po tytule, groupId]
- **Logika:** [Co kod i kontroler w Javie ma zrobić z informacją]
- **Zabezpieczenia:** [Zasady biznesowe, np. System sprawdza, czy `teacher_id` zgadza się z zalogowanym użytkownikiem]
- **Odpowiedź JSON:** [Zarys struktury danych zwrotnych]

**B. [Kolejna akcja...]**
[Powtórzyć format dla pozostałych endpointów związanych z zadaniem]

---

## Zasady dodatkowe:
- **Zawsze zachowuj styl konkretnego inżyniera oprogramowania.** Zamiast pisać "Jako nauczyciel...", pisz "Zabezpieczenie: System musi sprawdzić czy id nauczyciela się zgadza".
- Odnoś się z nazwy do rzeczywistych lub docelowych uwarunkowań technologicznych (MySQL, Spring Boot, React).
- Jeśli brakuje Ci kontekstu, zbadaj projekt zanim wygenerujesz definitywny task!
