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
- Jesli projekt ma wspolne tokeny i wrappery UI, korzystaj z nich w pierwszej kolejnosci.
- Dla modalI, formularzy, badge'y, kart i action area najpierw sprawdz:
  - `frontend/src/theme/uiTokens.ts`
  - `frontend/src/components/ui/dialog/*`
  - `frontend/src/components/ui/form/*`
  - `frontend/src/components/ui/chips/*`
  - `frontend/src/components/ui/panel/*`
- Nie trzymaj w miare mozliwosci nowego systemu styli w pliku konkretnego widoku.
- Nie dopisuj wielu lokalnych `const ...Sx = {}` w ekranie, jesli te same decyzje maja sens dla innych widokow.
- Gdy brakuje wspolnego wrappera, tokena albo wariantu UI, najpierw stworz go we wspoldzielonym miejscu, a dopiero potem uzyj w widoku.
- Widok ma zawierac glownie uzycie wspolnych komponentow i lokalny layout domenowy, a nie definicje calego systemu modalowego lub formularzowego.

## Kroki

1. Przeanalizuj analogiczne widoki i flow.
2. Zmapuj widok na `api-contract.md`.
3. Wykryj i nazwij ewentualny `Backend Gap`.
4. Zaimplementuj widok oraz integracje API.
5. Zweryfikuj krytyczne scenariusze i edge cases.
