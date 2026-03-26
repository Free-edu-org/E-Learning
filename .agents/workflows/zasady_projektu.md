---
description: [globalne zasady pracy agentow FreeEdu - stosuj zawsze]
---

# FreeEdu Engineering Agent Standard

Ten dokument definiuje wspolne zasady pracy agentow w projekcie FreeEdu.

## 1. Zasada nadrzedna

- `Code-first`: backend i frontend w repo sa zrodlem prawdy.
- Dokumentacja i testy maja odzwierciedlac aktualny kod.
- Agent ma dowozic wynik, nie tylko analize.

## 2. Obowiazkowy flow pracy

1. Analyze
2. Plan
3. Implement
4. Verify
5. Report

Nie pomijaj `Verify`. Jezeli cos blokuje prace, zgloś blocker jawnie.

## 3. Spojnosc zmian

- Zmieniaj tylko to, co jest potrzebne do celu.
- Zachowuj istniejące konwencje repo (nazwy, strukture plikow, styl kodu).
- Nie wprowadzaj nowego wzorca architektonicznego bez wyraznej potrzeby.

## 4. Backend (Java/Spring)

- Trzymaj warstwy: `Controller -> Service -> Repository`.
- Nie zwracaj encji bezposrednio do API; uzywaj DTO.
- Zmiany schematu bazy tylko przez nowe migracje Flyway.
- Security i role sprawdzaj deklaratywnie i logicznie (auth/authz + ownership).

## 5. Frontend (React/TS/MUI)

- Najpierw analizuj istniejace widoki i ich wzorce.
- Zachowuj spojnosc UI/UX i style projektu.
- Warstwa API w `frontend/src/api/*`; nie hardkoduj endpointow w widokach.
- Obowiazkowe stany: loading, empty, error, success.

## 6. API contract + testy

- Najpierw aktualizuj `api-contract.md` na podstawie kodu.
- Potem aktualizuj `.http`.
- Potem aktualizuj/generuj testy.
- Asercje testow maja byc precyzyjne (bez "moze byc X albo Y" bez dowodu).
- Styl testow ma byc zgodny z istniejącymi testami w repo.

## 7. Review standard

- Najpierw findings, od najwiekszego ryzyka (`SEV-1 -> SEV-3`).
- Kazdy finding: plik/linia, ryzyko, minimalny fix.
- Potem `Verdict`: `APPROVE`, `APPROVE WITH CONDITIONS`, `REJECT`.

## 8. Definition of Done

- Kod zgodny z wymaganiem i spójny z repo.
- Kontrakt i dokumentacja zaktualizowane.
- Testy przechodza.
- Znane luki/blokery jawnie zaraportowane.

## 9. Aktywne skille i ich rola

- `freeedu-jira-task-generator`: opisy zadan Jira.
- `freeedu-api-test-auditor`: kontrakt + `.http` + testy API.
- `freeedu-review-auditor`: rygorystyczny review i werdykt.
- `freeedu-frontend-view-implementer`: implementacja/edycja widokow frontend.
