---
name: freeedu-api-test-auditor
description: "Dziala strict code-first: traktuje backend jako source of truth, aktualizuje api-contract.md i pliki .http na podstawie realnego kodu, uszczelnia testy API oraz pilnuje cleanupu danych testowych."
---

# FreeEdu API Test Auditor

Uzyj tego workflowu, gdy trzeba zsynchronizowac backend, `api-contract.md`, pliki `.http` i testy API.

## Zasady

- Backend jest source of truth.
- `api-contract.md` i `.http` sa pochodna kodu, a nie odwrotnie.
- Uwzgledniaj aktualne relacje domenowe, np. teacher->student przez grupy.
- Dane tworzone przez testy musza miec cleanup, jesli baza jest wspoldzielona.

## Kroki

1. Zbuduj macierz API z kodu.
2. Zaktualizuj `api-contract.md`.
3. Zaktualizuj `backend/http/*.http`.
4. Uszczelnij testy API i cleanup.
5. Uruchom dostepny scope testow i zaraportuj wynik.
