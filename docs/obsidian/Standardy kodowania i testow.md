# Standardy kodowania i testow

Ta notatka opisuje minimalny standard zmian w FreeEdu.

## Backend

- Trzymaj podzial `controller -> service -> repository -> model/dto`.
- Controller odpowiada za HTTP, statusy, walidacje wejscia i `@PreAuthorize`.
- Service odpowiada za logike biznesowa, ownership i skladanie danych.
- Repository nie powinno zawierac logiki biznesowej.
- DTO traktuj jako kontrakt API, nie jako encje JPA.
- Nowy blad domenowy powinien miec stabilny kod i test.
- Przy zmianie endpointu aktualizuj [[Kontrakt API]], [[Mapa API]], `api-contract.md`, `.http` i testy.

## Frontend

- Widoki roli trzymaj w `frontend/src/features/{admin,teacher,student}`.
- Wspolne komponenty UI trzymaj w `frontend/src/components/ui`.
- Integracje HTTP dodawaj w `frontend/src/api`, a nie bezposrednio w widoku.
- Dostep do widokow ustawiaj w `App.tsx` przez `ProtectedRoute`.
- Rola i token powinny pochodzic z [[Auth Context]].

## Nazewnictwo

| Obszar | Konwencja |
|---|---|
| Backend controller | `{Domain}Controller` albo `{Role}DashboardController`. |
| Backend service | `{Domain}Service`. |
| Backend DTO request | `{Action}{Domain}Request` albo `{Domain}Request`. |
| Backend DTO response | `{Domain}Response`. |
| Frontend API service | `{domain}Service.ts`. |
| Frontend feature | `{RoleOrFeature}View.tsx` albo `{Role}Dashboard.tsx`. |
| Obsidian note | Krotka nazwa domenowa i linki do powiazanych notatek. |

## Kiedy dodawac testy

| Zmiana | Test minimalny |
|---|---|
| Nowa regula w service | Unit test service z exact assertions. |
| Nowy endpoint | Test API i plik `.http`. |
| Zmiana security/ownership | Test 401/403 oraz test pozytywny dla wlasciciela. |
| Zmiana DTO/walidacji | Test 400 i przyklad w kontrakcie. |
| Zmiana frontendu bez backendu | Build frontendu i test manualny flow. |
| Zmiana STT | Test bledu 503 albo mock integracji. |

## Definicja gotowosci zmiany API

- Endpoint dziala w kontrolerze i service.
- DTO ma walidacje.
- Security ma role i ownership check.
- `api-contract.md` opisuje request, response i bledy.
- `.http` pozwala odtworzyc request.
- Testy API pokrywaja happy path i najwazniejsze edge case'y.
- Obsidian ma link w [[Mapa API]] lub odpowiedniej notatce domenowej.

Powiazane:
- [[Testy]]
- [[Kontrakt API]]
- [[Macierz rol i uprawnien]]
- [[Szablony notatek/README - szablony|Szablony notatek]]
