---
name: freeedu-frontend-view-implementer
description: Implementuje wskazany widok frontendowy na podstawie istniejacego kodu i stylu projektu; utrzymuje spojnosc UI/UX, mapuje integracje do aktualnego api-contract pochodnego od backendu i zglasza realne Backend Gapy zamiast obchodzic je po stronie UI.
---

# FreeEdu Frontend View Implementer

Uzyj tego skilla, gdy uzytkownik prosi o implementacje lub edycje konkretnego widoku w frontendzie.

## Cel

Dowiezc widok produkcyjnej jakosci, zgodny z obecnym stylem aplikacji, bez psucia istniejacego UX i bez zgadywania API.

## Zasada glowna

- Najpierw analizuj to, co juz istnieje.
- Zachowuj styl i spojnosc projektu (layout, komponenty, nazwy, wzorce state management, patterny API).
- Integruj frontend z backendem 1:1 na podstawie `api-contract.md`, pamietajac ze kontrakt ma odzwierciedlac realny backend, a nie historyczne zalozenia.
- Jesli brakuje endpointu, pola lub semantyki po stronie backendu, zglos to jako blokujacy `Backend Gap` i nie implementuj "na skroty".

## Wejscie

- Widok wskazany przez uzytkownika (nowy lub edycja istniejacego).
- Kod frontendu: `frontend/src/**`
- Kontrakt API: `api-contract.md`
- Klienci API: `frontend/src/api/**`

## Workflow

1. Analiza istniejacego frontendu
- Znajdz analogiczne ekrany i flow.
- Ustal standardy projektu: struktura komponentow, routing, wzorce pobierania danych, error/loading states.

2. Analiza kontraktu API
- Zmapuj wymagania widoku na endpointy z `api-contract.md`.
- Sprawdz request/response, auth/authz i kody bledow.

3. Gap check (frontend vs backend)
- Jesli kontrakt lub backend nie pokrywa potrzeb widoku, wypisz brak jako `Backend Gap`.
- Podaj konkretnie, co trzeba dodac po stronie backendu: endpoint, pole, walidacja, ownership check, error code.
- Zatrzymaj implementacje zaleznosci blokowanej przez backend i oznacz to jawnie.

4. Implementacja widoku
- Edytuj istniejace komponenty tam, gdzie to logiczne; tworz nowe tylko gdy potrzebne.
- Zachowuj istniejacy wyglad i zachowanie aplikacji.
- Dodaj komplet stanow: loading, empty, error, success.
- Uwzglednij role i uprawnienia, jesli widok tego wymaga.

5. Integracja API
- Uzyj istniejacej warstwy `frontend/src/api/*`.
- Nie hardkoduj endpointow poza warstwa API.
- Rozszerz typy zgodnie z finalnym kontraktem wynikajacym z backendu.

6. Walidacja
- Sprawdz build, typy i lint, jesli sa dostepne.
- Przejdz krytyczne flow i edge cases.

7. Raport
- Co zostalo zaimplementowane.
- Jakie byly decyzje dot. spojnosci UI.
- Lista `Backend Gap`, jesli wystepuje, z konkretnymi wymaganiami dla backendu.

## Styl implementacji

- Preferuj minimalne, celowane zmiany.
- Nie zmieniaj globalnego stylu aplikacji bez prosby.
- Nie tworz nowego design systemu, jesli projekt ma juz wzorce.
- Trzymaj nazewnictwo i strukture plikow zgodna z repo.

Uzyj checklisty z `references/frontend-view-checklist.md`.
