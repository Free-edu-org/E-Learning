# Testy

Projekt ma trzy warstwy walidacji:
- testy jednostkowe backendu w `backend/src/test`
- testy API w `api-tests/tests`
- pliki `.http` w `backend/http`

Standard dopisywania testow przy zmianach jest w [[Standardy kodowania i testow]], a powiazanie testow z endpointami w [[Kontrakt API]].

Polaczenia:
- [[Backend]] -> testy serwisow i security
- [[Mapa API]] -> testy kontraktu API
- [[Domena - lekcje]], [[Domena - zadania]], [[Domena - grupy]] -> testy najwazniejszych regul biznesowych

## Stan testow API

**314 testow, 12 suite'ow — wszystkie przechodza.**

| Plik | Zakres |
|---|---|
| auth.test.js | Login, nieprawidlowe dane, walidacja |
| lessons.test.js | CRUD, filtry, sortowanie, status, delete |
| lessons-authorization.test.js | 401/403, ownership, admin override |
| tasks.test.js | 4 typy zadan CRUD, get tasks, authz, reset postępu |
| submit-lesson.test.js | Happy path, logika scoringu, authz, error scenarios |
| teacher-stats.test.js | Struktura, invarianty, security, wymuszanie metod HTTP |
| teacher-dashboard-access.test.js | Role access, data scoping, POST+PUT /teacher/students |
| teacher-lesson-stats.test.js | Wyniki lekcji — security, struktura, invarianty, pusta lekcja |
| student-dashboard-access.test.js | /student/stats, /student/lessons (group leak), /student/progress |
| admin-dashboard.test.js | /admin/stats, POST+PUT /admin/students, listy teachers/students |
| user-groups.test.js | CRUD, czlonkostwo, edge cases |
| users.test.js | Rejestracja, profil, haslo, usuniecie |

Najwazniejsze katalogi:
- [backend tests](../../backend/src/test/java/pl/freeedu/backend)
- [api tests](../../api-tests/tests)
- [http files](../../backend/http)
