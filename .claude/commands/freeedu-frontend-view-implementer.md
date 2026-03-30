---
name: freeedu-frontend-view-implementer
description: "Implementuje wskazany widok frontendowy na podstawie istniejacego kodu i stylu projektu; mapuje integracje do aktualnego api-contract pochodnego od backendu i zglasza realne Backend Gapy zamiast obchodzic je po stronie UI."
---

# FreeEdu Frontend View Implementer

Uzyj tego workflowu, gdy trzeba dowiezc lub poprawic konkretny widok frontendowy.

## Zasady

- Analizuj najpierw istniejacy frontend.
- Zachowuj spojnosc UI/UX projektu.
- Integruj frontend z backendem przez aktualny kontrakt wynikajacy z kodu.
- Gdy backend nie pokrywa potrzeb, zglaszaj `Backend Gap` zamiast robic obejscia.

## Kroki

1. Przeanalizuj analogiczne widoki i flow.
2. Zmapuj widok na `api-contract.md`.
3. Wykryj i nazwij ewentualny `Backend Gap`.
4. Zaimplementuj widok oraz integracje API.
5. Zweryfikuj krytyczne scenariusze i edge cases.
