---
description: Pisze precyzyjne testy jednostkowe backendu FreeEdu dla zmienionego kodu, w stylu given-when-then z JUnit 5 i Mockito, z exact assertions i naciskiem na branch coverage, side effecty oraz brak ubocznych zapisow.
---

Uzyj skilla `freeedu-backend-unit-test-writer`.

Zasady:
- backend jest source of truth,
- skup sie na aktualnym diffie backendu,
- pisz testy tylko tam, gdzie zmiana ma sens regresyjny,
- stosuj JUnit 5 + Mockito,
- **MANDATORY BDD COMMENTS:** Każda metoda testowa MUSI zawierać sekcje `// given`, `// when`, `// then`. Nie wolno ich łączyć ani pomijać.
- **BEZWZGLEDNY ZAKAZ zmiany kodu produkcyjnego (src/main)** - ten skill służy wyłącznie do pisania testów. Jeśli w kodzie jest błąd, zgłoś go użytkownikowi, ale nie naprawiaj go.
- sprawdzaj exact exception, error code, status logic i interakcje z mockami,
- pilnuj testow na brak write przy bledzie,
- nie zostawiaj rozmytych asercji ani szerokich dopuszczen wielu statusow bez uzasadnienia.
