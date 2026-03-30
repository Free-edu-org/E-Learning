---
description: Pisze precyzyjne testy jednostkowe backendu FreeEdu dla zmienionego kodu, w stylu given-when-then z JUnit 5 i Mockito, z exact assertions i naciskiem na branch coverage, side effecty oraz brak ubocznych zapisow.
---

Uzyj skilla `freeedu-backend-unit-test-writer`.

Zasady:
- backend jest source of truth,
- skup sie na aktualnym diffie backendu,
- pisz testy tylko tam, gdzie zmiana ma sens regresyjny,
- stosuj JUnit 5 + Mockito,
- uzywaj stylu given-when-then,
- sprawdzaj exact exception, error code, status logic i interakcje z mockami,
- pilnuj testow na brak write przy bledzie,
- nie zostawiaj rozmytych asercji ani szerokich dopuszczen wielu statusow bez uzasadnienia.
