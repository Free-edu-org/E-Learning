# Mapa systemu

[[Frontend]] komunikuje sie z [[Backend]] przez [[Mapa API]]. [[Backend]] zapisuje dane w [[Model danych]] i wywoluje [[STT Service]] podczas zadan mowionych. Calosc lokalnie spina [[Docker i runtime]].

Szczegolowy przeplyw requestu i miejsca w repo sa opisane w [[Mapa architektury]]. Nazwy domenowe sa zebrane w [[Glosariusz domenowy]], a przejscia po aplikacji per rola w [[Role Flows/README - Role Flows|Role Flows]].

```mermaid
flowchart LR
  User["Uzytkownik"] --> Frontend["Frontend React"]
  Frontend --> Api["REST API /api/v1"]
  Api --> Backend["Backend Spring Boot"]
  Backend --> Db["MySQL + Flyway"]
  Backend --> Stt["STT Service FastAPI"]
  Stt --> Whisper["faster-whisper"]
  Backend --> Tests["Testy backend/API"]
```

Polaczenia modulow:
- [[Frontend]] -> [[API Client]] -> [[Mapa API]]
- [[Backend]] -> [[Security]] -> [[Domena - uzytkownicy]]
- [[Backend]] -> [[Domena - lekcje]] -> [[Domena - zadania]]
- [[Domena - grupy]] laczy [[Rola - Teacher]] z [[Rola - Student]]
- [[Domena - postep studenta]] laczy [[Domena - uzytkownicy]], [[Domena - lekcje]] i [[Domena - zadania]]
- [[STT Service]] jest uzywany przez [[Przeplyw - rozpoznawanie mowy]]
- [[Kontrakt API]] i [[Macierz rol i uprawnien]] lacza endpointy z rolami oraz owner-checkami
- [[Uruchomienie lokalne]] i [[Troubleshooting]] pomagaja wystartowac i diagnozowac srodowisko

Zrodla:
- [docker-compose.yml](../../docker-compose.yml)
- [README.md](../../README.md)
- [application.yaml](../../backend/src/main/resources/application.yaml)
