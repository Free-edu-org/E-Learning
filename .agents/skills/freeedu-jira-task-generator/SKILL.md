---
name: FreeEdu Jira Task Generator
description: Produkuje ustandaryzowane techniczne opisy zadan do Jiry na podstawie analizy SWS i obecnego stanu bazy danych.
---

# FreeEdu Jira Task Generator

Ten skill sluzy do automatycznego generowania precyzyjnych, technicznych opisow zadan do Jiry dla projektu FreeEdu.

## Kiedy uzywac

Gdy uzytkownik prosi o przygotowanie opisu zadania do Jiry, rozpiske zadania lub specyfikacje implementacyjna na podstawie wymagan i obecnej architektury.

## Kroki

1. Przeanalizuj wymagania z `tmp_sws.txt` lub wskazanych sekcji SWS.
2. Sprawdz migracje i aktualna strukture danych w `backend/src/main/resources/db/migration`.
3. Przejrzyj aktualna implementacje backend/frontend dla wskazanego obszaru.
4. Przygotuj opis po polsku wedlug szablonu.

### Szablon zadania Jira

**Cel zadania:** [krotki opis biznesowo-techniczny]

#### Zarys aktualnej architektury wzgledem zadania
- **Co jest (obecny stan):** [...]
- **Co brakuje:** [...]
- **Co poprawic (refactoring):** [...]
- **Nice to have:** [...]

#### 1. Zmiany w bazie danych
- **[Tabela/Akcja]:** [...]
- **[Relacje/Statusy]:** [...]

#### 2. Specyfikacja endpointow (REST API)
**A. [Nazwa akcji]**
- **URL:** [...]
- **Metoda:** [...]
- **Uprawnienia:** [...]
- **Request body / parametry:** [...]
- **Logika:** [...]
- **Zabezpieczenia:** [...]
- **Odpowiedz JSON:** [...]

**B. [Nazwa akcji]**
- Powtorz format.

## Zasady

- Uzywaj stylu technicznego, konkretnego i bez ogolnikow.
- Odnos sie do realnych warunkow technologicznych projektu (MySQL, Spring Boot, React).
- Jesli brakuje kontekstu, najpierw zbadaj projekt.
