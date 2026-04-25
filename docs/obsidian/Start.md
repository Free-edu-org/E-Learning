# Start

FreeEdu to platforma e-learningowa z podzialem na trzy role: [[Rola - Admin]], [[Rola - Teacher]] i [[Rola - Student]].

## Od czego zaczac

1. Przeczytaj [[Mapa systemu]], zeby zobaczyc najkrotszy obraz aplikacji.
2. Otworz [[Mapa architektury]], jesli chcesz zrozumiec przeplyw requestu od UI do bazy.
3. Wejdz w [[Glosariusz domenowy]], kiedy nazwy biznesowe i nazwy klas zaczynaja sie mieszac.
4. Do pracy lokalnej uzyj [[Uruchomienie lokalne]] i [[Troubleshooting]].
5. Przy zmianach w API sprawdz [[Kontrakt API]], [[Mapa API]] i [[Macierz rol i uprawnien]].
6. Przy planowaniu widokow otworz [[Role Flows/README - Role Flows|Role Flows]].

## Mapa dokumentacji

Backend:
- [[Backend]]
- [[Mapa architektury]]
- [[Security]]
- [[Bledy API]]
- [[Standardy kodowania i testow]]

Frontend:
- [[Frontend]]
- [[API Client]]
- [[Auth Context]]
- [[Protected Route]]
- [[Role Flows/README - Role Flows|Role Flows]]

API:
- [[Kontrakt API]]
- [[Mapa API]]
- [api-contract.md](../../api-contract.md)
- [backend/http](../../backend/http)

Baza:
- [[Model danych]]
- [[Domena - uzytkownicy]]
- [[Domena - grupy]]
- [[Domena - lekcje]]
- [[Domena - zadania]]
- [[Domena - postep studenta]]

Testy:
- [[Testy]]
- [[Standardy kodowania i testow]]
- [api-tests](../../api-tests)

Deployment i runtime:
- [[Docker i runtime]]
- [[Uruchomienie lokalne]]
- [[Troubleshooting]]
- [[STT Service]]

Domena:
- [[Glosariusz domenowy]]
- [[Awatary uzytkownikow]]
- [[Macierz rol i uprawnien]]
- [[Rola - Admin]]
- [[Rola - Teacher]]
- [[Rola - Student]]

Decyzje i szablony:
- [[Decision log]]
- [[ADR/README - decyzje architektoniczne|ADR]]
- [[Szablony notatek/README - szablony|Szablony notatek]]

## Rdzen systemu

- [[Mapa systemu]]
- [[Mapa architektury]]
- [[Backend]]
- [[Frontend]]
- [[STT Service]]
- [[Model danych]]
- [[Glosariusz domenowy]]
- [[Kontrakt API]]
- [[Mapa API]]
- [[Macierz rol i uprawnien]]
- [[Docker i runtime]]
- [[Uruchomienie lokalne]]
- [[Testy]]
- [[Standardy kodowania i testow]]
- [[Troubleshooting]]

## Glowne przeplywy

- [[Role Flows/README - Role Flows|Role Flows]]
- [[Przeplyw - logowanie i sesja]]
- [[Przeplyw - nauczyciel tworzy lekcje]]
- [[Przeplyw - student rozwiazuje lekcje]]
- [[Przeplyw - administracja uzytkownikami]]
- [[Przeplyw - rozpoznawanie mowy]]

## Najwazniejsze obszary domenowe

- [[Domena - uzytkownicy]]
- [[Awatary uzytkownikow]]
- [[Domena - grupy]]
- [[Domena - lekcje]]
- [[Domena - zadania]]
- [[Domena - postep studenta]]

## Wejscia do kodu

- [backend](../../backend/src/main/java/pl/freeedu/backend)
- [frontend](../../frontend/src)
- [stt-service](../../stt-service/app/main.py)
- [api-contract](../../api-contract.md)
