---
name: freeedu-backend-gap-implementer
description: Implementuje realne Backend Gapy w FreeEdu, gdy frontend, review lub audit kontraktu ujawnia brakujacy endpoint, DTO, logike serwisowa, security, ownership check, walidacje, error code albo testy. Uzyj, gdy trzeba dowiezc backend zgodnie z obecna architektura WebFlux, zasadami security i kontraktem wynikajacym z kodu.
---

# FreeEdu Backend Gap Implementer

Uzyj tego skilla, gdy w trakcie pracy nad frontendem, kontraktem lub review wychodzi, ze funkcja blokuje sie na brakujacym backendzie i trzeba ten backend dopisac zamiast zostawic sam raport `Backend Gap`.

## Cel

Dowiezc brakujacy backend tak, aby:
- pasowal do obecnej architektury projektu,
- nie obchodzil istniejacych zasad security,
- byl spojny z kontraktem API i globalna obsluga bledow,
- zawieral sensowna walidacje i testowalny flow end-to-end.

## Zasada glowna

- Najpierw analizuj istniejacy backend, dopiero potem implementuj.
- Nie wymyslaj nowego wzorca, jesli w repo juz istnieje odpowiedni.
- Uprawnienia sa czescia funkcjonalnosci, nie dodatkiem na koncu.
- Jesli frontend potrzebuje nowego endpointu lub audit wykrywa dryf, doprowadz tez kontrakt, bledy, `.http` i testy do stanu spojnego z kodem.

## Wejscie

- Kod backendu: `backend/src/main/java/pl/freeedu/backend/**`
- Kontrakt API: `api-contract.md`
- Security: `backend/src/main/java/pl/freeedu/backend/security/**`
- Wyjatki: `backend/src/main/java/pl/freeedu/backend/exception/**`
- Migracje DB: `backend/src/main/resources/db/migration/**`
- HTTP smoke/manual tests: `backend/http/*.http`
- API tests: `api-tests/tests/*.test.js`

## Workflow

1. Zidentyfikuj realny gap
- ustal czego brakuje: endpointu, listowania, DTO, walstwy BFF, logiki serwisu, walidacji, ownership check, error code, migracji, testow
- potwierdz, ze brak nie jest juz zaimplementowany w backendzie pod inna nazwa lub w innym module
- nazwij brak konkretnie jako `Backend Gap`

2. Znajdz najblizszy wzorzec w repo
- znajdz analogiczny modul i skopiuj jego strukture, nie tylko sygnature metod
- porownuj: `controller/v1`, `service`, `dto`, `repository`, `exception`, `mapper`
- dla endpointow CRUD patrz szczegolnie na `user`, `usergroup`, `lesson`, `teacher`, `admin`

3. Dopasuj miejsce implementacji
- jesli to domena CRUD, rozbuduj istniejacy modul domenowy
- jesli to panelowy wyciag danych dla konkretnej roli, preferuj warstwe BFF typu `admin`, `teacher`, `student`
- nie mieszaj przypadkowo odpowiedzialnosci, np. nie wrzucaj logiki admin dashboard do `user`

4. Zaprojektuj security przed kodem
- sprawdz `SecurityConfig` i istniejace `@PreAuthorize`
- ustal, czy dostep ma byc:
- `hasRole('ADMIN')`
- `hasRole('TEACHER')`
- owner-only
- role + relation check, np. teacher->student przez grupy albo group owner
- jesli potrzebny jest nowy warunek domenowy, rozszerz `securityService` zamiast duplikowac logike w serwisie lub kontrolerze
- upewnij sie, ze endpoint nie ujawnia danych roli, ktora nie powinna ich zobaczyc

5. Implementuj zgodnie ze stylem backendu
- kontrolery WebFlux: `Mono`/`Flux`, `@ResponseStatus`, `@Valid`, request body jako `Mono<RequestDto>` tam, gdzie taki wzorzec juz wystepuje
- DTO i mappery trzymaj w module domenowym
- logike biznesowa trzymaj w serwisie, nie w kontrolerze
- korzystaj z istniejacych repozytoriow i encji; jesli potrzeba nowego zapytania, dopisz je w repo zgodnie z obecnym stylem
- jesli potrzebna jest nowa tabela lub relacja, dodaj migracje zamiast obchodzenia modelu

6. Zachowaj spojny model bledow
- preferuj dedykowane exceptiony domenowe i enum error code, jak w `usergroup` lub `lesson`
- wszystkie spodziewane bledy maja konczyc jako `ProblemDetail` z `code`
- mapuj:
- walidacje -> `VALIDATION_FAILED`
- brak zasobu -> domenowy `*_NOT_FOUND`
- konflikt -> domenowy `*_ALREADY_EXISTS` / `CONFLICT`
- brak uprawnien -> `FORBIDDEN`
- nie dodawaj "surowych" odpowiedzi tekstowych, jesli modul zwraca JSON ProblemDetail

7. Domknij kontrakt i testowalnosc
- zaktualizuj `api-contract.md` zgodnie z finalnym zachowaniem kodu
- jesli zmiana dotyczy API, zaktualizuj `backend/http/*.http`
- jesli istnieja testy API dla obszaru, dopisz brakujace scenariusze
- szczegolnie sprawdz:
- 401 bez tokena
- 403 dla zlej roli lub braku ownership
- 404 dla brakujacego zasobu
- 409 dla konfliktow
- 400 dla walidacji i zlych danych

8. Zweryfikuj implementacje
- uruchom backendowe testy lub przynajmniej build/test scope dostepny w projekcie
- jesli dotyczy endpointu, potwierdz happy path i auth/authz path
- jesli nie dalo sie uruchomic testow, napisz to wprost i podaj dlaczego

## Standardy projektu, ktorych trzeba pilnowac

- Architektura:
- backend jest modularny per domena
- kontrolery sa wersjonowane przez `controller/v1`
- warstwa BFF istnieje dla dashboardow rolowych

- Security:
- globalne bramy rolowe sa w `SecurityConfig`
- precyzyjne ograniczenia sa w `@PreAuthorize`
- relacje typu owner i domain ownership sa sprawdzane przez `securityService`

- Error handling:
- projekt uzywa `ProblemDetail`
- domenowe exceptiony trafiaja do `GlobalExceptionHandler`

- Kontrakt:
- `api-contract.md` ma odzwierciedlac realny kod, nie odwrotnie

## Backend Gap Decision Rules

- Jesli frontend potrzebuje listy zasobow, a backend ma tylko `GET /{id}`, to nie obchodz tego po stronie UI; doprojektuj bezpieczny endpoint listujacy.
- Jesli nowy endpoint wymaga filtrowania po roli lub relacji, zaprojektuj to jawnie, nie "po prostu dla admina".
- Jesli dane sa wrazliwe, preferuj ograniczony response DTO zamiast expose encji lub zbyt szerokiego modelu.
- Jesli brakuje mozliwosci odroznienia bledow po stronie frontendowej, dopisz sensowny error code zamiast zostawiac generic 500/409.

## Raport koncowy

Zaraportuj:
- jaki `Backend Gap` byl przyczyna
- co zostalo doimplementowane w backendzie
- jakie uprawnienia i ownership checks zostaly dodane
- jakie pliki kontraktu/testow zostaly zaktualizowane
- wynik build/testow
- ewentualne ograniczenia lub follow-upy

Uzyj checklisty z `references/backend-gap-checklist.md`.
