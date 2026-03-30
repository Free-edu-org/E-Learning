# FreeEdu API Test Auditor

Uzyj tego skilla, gdy celem jest utrzymanie dokumentacji i testow API 1:1 z aktualnym kodem backendu.

## Zasada glowna (Code-First)

- Backend jest zrodlem prawdy.
- `api-contract.md` ma byc aktualizowany na podstawie kodu (kontrolery, security, wyjatki, DTO).
- Testy i pliki `.http` maja byc aktualizowane na podstawie finalnego kontraktu wynikajacego z kodu.
- Po zmianach uruchom testy i potwierdz wynik.

## Wejscie

- Kontrakt: `api-contract.md`
- Testy API: `api-tests/tests/*.test.js`
- Requesty reczne: `backend/http/*.http`
- Security: `backend/src/main/java/**/SecurityConfig.java` i `@PreAuthorize`
- Implementacja API: `backend/src/main/java/**/controller/**`, `service/**`, `exception/**`, `dto/**`

## Workflow

1. Zbuduj macierz API z kodu (source of truth):
- endpoint
- metoda
- auth/authz (rola, owner, relacje)
- sukces (status + shape)
- bledy (status + code)

2. Zaktualizuj `api-contract.md` na podstawie tej macierzy:
- endpointy, role i warunki dostepu
- statusy sukcesu i bledow
- struktury request/response
- uwagi o realnym zachowaniu backendu (np. plain text vs ProblemDetail)

3. Zbuduj macierz testow i porownaj z kontraktem:
- brakujace przypadki
- przestarzale przypadki
- nieprecyzyjne asercje (np. `[401,403]`, `[404,405,500]`)

4. Zaktualizuj testy:
- oczekuj jednego statusu na przypadek
- sprawdzaj `code` dla ProblemDetail, gdy backend zwraca JSON
- gdy backend zwraca `text/plain` lub puste body, asercja ma to jasno odzwierciedlac
- zachowuj styl testow zgodny z istniejacymi plikami w `api-tests/tests`:
  - podobna struktura `describe/it`
  - podobny styl nazw scenariuszy
  - podobny styl asercji i setupu tokenow

5. Pokryj uprawnienia i ownership:
- brak tokena (401)
- niepoprawna rola (403)
- owner vs non-owner
- teacher->student relation (`teacherId`)
- admin-only i teacher-only endpoints

6. Pokryj edge/corner cases:
- validation boundaries (empty, whitespace, malformed, max length)
- duplicate resources i konflikty (409)
- non-existent resources (404)
- invalid method/path/content-type
- stale token / malformed token / invalid signature / expired token
- idempotencja i powtorne wykonanie akcji

7. Uaktualnij `.http`:
- dodaj brakujace requesty dla endpointow z kontraktu
- trzymaj nazwy sekcji i payloady zgodne z kontraktem
- dodaj scenariusze: happy path + authz fail + validation fail

8. Uruchom testy:
- `cd api-tests && npm test -- --runInBand`
- opcjonalnie: `npm test -- --runInBand --coverage`

9. Raportuj wynik:
- co zaktualizowano w `api-contract.md`
- jakie testy dodano/zaostrzono
- wynik testow
- ewentualne znane rozjazdy do naprawy w kodzie

Uzyj checklisty z `.agents/skills/freeedu-api-test-auditor/references/api-test-audit-checklist.md`.
