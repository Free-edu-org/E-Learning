# Uruchomienie lokalne

Ta notatka zbiera minimalna sciezke startu i typowe decyzje runtime. Szczegolowy opis Dockera jest w [[Docker i runtime]].

## Wymagania

- Java 25.
- Maven wrapper z `backend/mvnw`.
- Node.js zgodny z frontendem Vite.
- Docker i Docker Compose.
- Porty lokalne: `3306`, `8080`, `5173`, `8000`.

## Pliki env

Skopiuj przyklady:

```powershell
Copy-Item .env.example -Destination .env
Copy-Item backend\.env.example -Destination backend\.env
Copy-Item frontend\.env.example -Destination frontend\.env
```

Najwazniejsze zmienne:

| Zmienna | Gdzie | Znaczenie |
|---|---|---|
| `MYSQL_DATABASE` | `.env` | Nazwa bazy Dockera. |
| `MYSQL_USER` | `.env` | Uzytkownik MySQL. |
| `MYSQL_PASSWORD` | `.env` | Haslo MySQL. |
| `BACKEND_PORT` | `.env` | Port backendu wystawiony lokalnie. |
| `SPRING_PROFILES_ACTIVE` | `.env`, `backend/.env` | Profil `docker` albo `local`. |
| `JWT_SECRET_KEY` | `backend/.env` | Sekret podpisu tokenow. |
| `JWT_EXPIRATION` | `backend/.env` | Czas zycia tokenu w ms. |
| `VITE_API_URL` | `frontend/.env` | Bazowy URL backendu dla frontendu. |
| `STT_MODEL_SIZE` | `.env` | Model faster-whisper. |
| `STT_DEVICE` | `.env` | `cpu` albo GPU, jesli srodowisko wspiera. |

## Pelny start przez Docker

```powershell
cd backend
.\mvnw clean package -DskipTests
cd ..
docker-compose up -d --build
```

Wejscia:
- frontend: `http://localhost:5173`
- backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- STT: `http://localhost:8000`

## Start lokalny dla pracy w IDE

Najpierw baza:

```powershell
docker-compose up -d mysql
```

Backend:

```powershell
cd backend
.\mvnw spring-boot:run
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

STT osobno, jesli testujesz zadania `speak`:

```powershell
docker-compose up -d stt-service
```

## Komendy weryfikacyjne

```powershell
cd backend
.\mvnw test
```

```powershell
cd frontend
npm run build
```

```powershell
cd api-tests
npm test
```

## Typowe problemy

- Backend nie wstaje, bo MySQL jeszcze nie jest gotowy: sprawdz healthcheck kontenera `freeedu-mysql`.
- Frontend dostaje 401/403: sprawdz token w [[Auth Context]] i role w [[Protected Route]].
- Frontend nie widzi backendu: sprawdz `VITE_API_URL` i CORS w [[Security]].
- STT zwraca 503: sprawdz `STT_BASE_URL`, kontener `freeedu-stt` i zmienne modelu.

Powiazane:
- [[Troubleshooting]]
- [[Docker i runtime]]
- [[Mapa architektury]]
