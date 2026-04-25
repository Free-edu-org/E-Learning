# Troubleshooting

Krotka mapa objawow, przyczyn i miejsc do sprawdzenia.

## Backend nie startuje

Objawy:
- `Connection refused` do MySQL.
- Flyway zatrzymuje start.
- Port `8080` jest zajety.

Sprawdz:
- `docker-compose ps`
- logi `freeedu-mysql` i `freeedu-backend`
- `.env` oraz `backend/.env`
- migracje w `backend/src/main/resources/db/migration`

Typowe naprawy:
- uruchom baze: `docker-compose up -d mysql`
- poczekaj na healthcheck MySQL
- sprawdz, czy lokalny proces nie zajmuje `8080`
- przy lokalnym backendzie ustaw `SPRING_PROFILES_ACTIVE=local`

## Frontend nie widzi API

Objawy:
- requesty ida pod zly host,
- CORS blokuje odpowiedz,
- dashboard pokazuje pusty stan mimo zalogowania.

Sprawdz:
- `frontend/.env` i `VITE_API_URL`
- `frontend/src/api/apiClient.ts`
- CORS w [[Security]]
- czy backend dziala na `http://localhost:8080`

## JWT nie dziala

Objawy:
- `401 Unauthorized`,
- redirect do `/login`,
- `GET /api/v1/users/me` zwraca blad.

Sprawdz:
- token w local storage / Auth Context,
- `JWT_SECRET_KEY` i `JWT_EXPIRATION`,
- `JwtAuthenticationFilter`,
- czy request ma `Authorization: Bearer <token>`.

## Dostaje 403 mimo poprawnego logowania

Objawy:
- widok dziala, ale akcja zwraca `403`,
- nauczyciel nie moze edytowac zasobu,
- uczen nie widzi lekcji.

Sprawdz:
- [[Macierz rol i uprawnien]],
- `@PreAuthorize` w kontrolerze,
- `SecurityService`,
- relacje `user_in_group` i `group_has_lesson`.

## STT nie dziala

Objawy:
- transkrypcja zwraca `503`,
- upload audio przechodzi, ale wynik jest pusty,
- kontener STT dlugo startuje.

Sprawdz:
- `STT_BASE_URL`,
- kontener `freeedu-stt`,
- zmienne `STT_MODEL_SIZE`, `STT_DEVICE`, `STT_COMPUTE_TYPE`, `STT_LANGUAGE`,
- [[STT Service]] i [[Przeplyw - rozpoznawanie mowy]].

## Testy zostawiaja dane w bazie

Objawy:
- kolejny test dostaje `409`,
- test przechodzi lokalnie, ale pada po kilku uruchomieniach,
- wspoldzielona baza developerska ma stare dane.

Sprawdz:
- czy test tworzy unikalne emaile i username,
- czy cleanup usuwa dane w odwrotnej kolejnosci relacji,
- czy test nie zaklada stalego ID,
- czy `.http` nie zostawil danych recznie.

Powiazane:
- [[Uruchomienie lokalne]]
- [[Testy]]
- [[Kontrakt API]]
- [[Security]]
