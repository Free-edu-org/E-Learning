---
name: freeedu-jira-task-generator
description: Generuje ustandaryzowane techniczne opisy zadan do Jiry na podstawie SWS, aktualnego kodu backend/frontend, kontraktu API oraz obecnego modelu danych projektu FreeEdu.
---

# FreeEdu Jira Task Generator

Uzyj tego skilla, gdy uzytkownik prosi o przygotowanie technicznego opisu zadania do Jiry dla FreeEdu.

## Cel

Dowiezc task do Jiry, ktory jest konkretny, implementowalny i osadzony w realnej architekturze projektu, a nie w historycznych zalozeniach.

## Workflow

1. Przeanalizuj wymagania
- przeczytaj wskazana sekcje SWS lub `tmp_sws.txt`
- ustal cel biznesowy i zakres funkcjonalny

2. Zbierz aktualny stan projektu
- sprawdz kod backendu i frontendu dla wskazanego obszaru
- sprawdz `api-contract.md`, jesli temat dotyczy API
- sprawdz migracje i model danych w `backend/src/main/resources/db/migration`

3. Zidentyfikuj realne luki i ograniczenia
- odroznij to, co juz istnieje, od tego, co trzeba doimplementowac
- uwzglednij aktualne reguly security, ownership i relacje domenowe

4. Przygotuj opis zadania
- po polsku
- technicznie i konkretnie
- z rozdzieleniem na backend, frontend, API, DB i testy, jesli to potrzebne

## Szablon

**Cel zadania:** [krotki opis biznesowo-techniczny]

#### Zarys aktualnej architektury wzgledem zadania
- **Co jest (obecny stan):** [...]
- **Czego brakuje:** [...]
- **Ryzyka / ograniczenia:** [...]
- **Zakres implementacji:** [...]

#### 1. Zmiany w bazie danych
- **Tabele / relacje:** [...]
- **Migracje:** [...]

#### 2. API / kontrakt
- **Endpointy:** [...]
- **Request / response:** [...]
- **Auth / authz / ownership:** [...]
- **Error codes:** [...]

#### 3. Backend
- **Moduly / serwisy / repozytoria:** [...]
- **Walidacja i logika biznesowa:** [...]

#### 4. Frontend
- **Widoki / flow / integracja API:** [...]

#### 5. Testy i walidacja
- **Testy backendowe / API / frontendowe:** [...]
- **Cleanup danych testowych:** [...]

## Zasady

- Uzywaj stylu technicznego, konkretnego i bez ogolnikow.
- Opieraj sie na aktualnym kodzie projektu, nie na starych zalozeniach.
- Jesli brakuje kontekstu, najpierw zbadaj projekt.
