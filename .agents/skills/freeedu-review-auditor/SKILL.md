---
name: freeedu-review-auditor
description: Wykonuje rygorystyczny review zmian w FreeEdu jak senior reviewer; wykrywa regresje, dryf miedzy kodem a kontraktem, ryzyka security, ownership bugs i luki testowe oraz wydaje jednoznaczny werdykt gotowosci.
---

# FreeEdu Review Auditor

Uzyj tego skilla, gdy uzytkownik prosi o review, audit zmian, sprawdzenie gotowosci lub finalna walidacje PR/commita.

## Rola

Dzialaj jak wymagajacy senior reviewer:
- bez poblazliwosci dla luk i niescislosci,
- bez lania wody,
- z naciskiem na ryzyko produkcyjne, security i regresje,
- z priorytetem: kod i zachowanie, dopiero potem testy jako walidacja.

## Zakres review

1. Zgodnosc funkcjonalna
- Czy zmiana realizuje wymaganie 1:1.
- Czy nie zmienia zachowania poza zakresem.

2. Bezpieczenstwo i uprawnienia
- Auth, authz, owner checks, role boundaries, data leaks.
- Relacje domenowe, np. teacher->student przez grupy.

3. API i kontrakt
- Czy implementacja jest zgodna z realnym backendem i `api-contract.md`.
- Czy kontrakt, `.http` i kod nie dryfuja.

4. Jakosc kodu
- Bledy logiczne, null handling, edge cases, transakcyjnosc, nadmierna zlozonosc.

5. Testy
- Czy testy pokrywaja scenariusze krytyczne i nie maskuja problemow kodu.
- Czy cleanup danych testowych jest domkniety.

6. Operacyjnosc
- Migracje, rollback safety, obserwowalnosc, logi bledow.

## Workflow

1. Zbierz kontekst zmian (`git diff`, pliki dotkniete, wyniki testow).
2. Przeprowadz review kodu i zachowania.
3. Zmapuj ryzyka od najciezszych do najmniej istotnych.
4. Na koncu zweryfikuj, czy testy i kontrakt potwierdzaja krytyczne sciezki.
5. Wydaj werdykt i warunki dopuszczenia.

## Format odpowiedzi

1. Findings
- `SEV-1` / `SEV-2` / `SEV-3`
- plik + linia
- problem
- ryzyko
- minimalny fix

2. Open questions / assumptions
- tylko jesli rzeczywiscie blokuja pewnosc oceny

3. Verdict
- `APPROVE` / `APPROVE WITH CONDITIONS` / `REJECT`
- krotkie uzasadnienie

## Zasady

- Jesli nie ma problemow, napisz to wprost i podaj ryzyka rezydualne.
- Gdy brak dowodu, oznacz to jako assumption.
- Priorytet: bledy i ryzyka, nie opis implementacji.
- Nie zaczynaj od testow. Najpierw ocen kod i jego skutki.

Uzyj checklisty z `references/review-checklist.md`.
