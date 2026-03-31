---
name: freeedu-backend-gap-implementer
description: "Implementuje realne Backend Gapy w FreeEdu, gdy frontend, review lub audit kontraktu ujawnia brakujacy endpoint, DTO, logike serwisowa, ownership check, walidacje, error code albo testy."
---

# FreeEdu Backend Gap Implementer

Uzyj tego workflowu, gdy trzeba dopisac lub poprawic backend, a nie tylko opisac problem.

## Zasady

- Najpierw analizuj istniejacy backend.
- Security i ownership sa czescia funkcjonalnosci.
- Kontrakt, `.http` i testy domykaj razem z kodem.
- Relacje domenowe opieraj o aktualny model, np. teacher->student przez grupy.

## Kroki

1. Nazwij konkretny `Backend Gap`.
2. Znajdz najblizszy wzorzec w repo.
3. Zaprojektuj security i ownership.
4. Zaimplementuj backend zgodnie ze stylem projektu.
5. Zsynchronizuj kontrakt, `.http` i testy.
6. Zweryfikuj build/test scope dostepny lokalnie.
