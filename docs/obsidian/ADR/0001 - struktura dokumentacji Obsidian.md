# 0001 - struktura dokumentacji Obsidian

Status: accepted

Data: 2026-04-25

## Kontekst

Dokumentacja FreeEdu miala juz notatki o backendzie, frontendzie, API, rolach i przeplywach. Brakowalo jednak jednego wejscia startowego, glosariusza, macierzy uprawnien, standardow pracy, troubleshootingu, szablonow i pelnych przeplywow per rola.

## Decyzja

Dokumentacja Obsidian bedzie organizowana przez:
- [[Start]] jako glowna mape dokumentacji,
- [[Glosariusz domenowy]] jako mapowanie nazw biznesowych na kod,
- [[Mapa architektury]] jako przeplyw requestu i mapa warstw,
- [[Kontrakt API]] oraz [[Mapa API]] jako wejscia do endpointow,
- [[Macierz rol i uprawnien]] jako szybka kontrola security,
- [[Role Flows/README - Role Flows|Role Flows]] jako folder przejsc przez moduly z perspektywy admina, nauczyciela i ucznia,
- [[Szablony notatek/README - szablony|Szablony notatek]] jako standard nowych wpisow.

## Konsekwencje

- Nowe funkcje powinny dostawac linki z `Start.md` albo odpowiedniego MOC.
- Zmiany w API wymagaja synchronizacji kodu, `api-contract.md`, `.http`, testow i notatek.
- Role Flows moga sluzyc jako baza do testow E2E i weryfikacji brakow backendowych.

## Powiazane

- [[Decision log]]
- [[Standardy kodowania i testow]]
- [[Troubleshooting]]
