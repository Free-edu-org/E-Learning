# Podsumowanie Scope: Preparation for Azure Deployment

Ten dokument zawiera finalne zestawienie zmian wprowadzonych w celu przygotowania projektu FreeEdu do wdrożenia na Azure Container Apps. Wszystkie zmiany architektoniczne (refactor StorageService) zostały wycofane – scope skupia się wyłącznie na **deployment readiness**.

## 1. Zmodyfikowane Pliki (Git Scope)

| Obszar | Plik | Opis Zmiany |
| :--- | :--- | :--- |
| **Backend** | `backend/Dockerfile.prod` | Multi-stage build (JDK -> JRE), `HEALTHCHECK`, profil `prod`. |
| | `backend/src/main/java/pl/freeedu/backend/security/config/SecurityConfig.java` | Dynamiczny CORS z `allowed-origins` (wiele originów). |
| | `backend/src/main/resources/application-prod.yaml` | Produkcyjna konfiguracja, wyłączenie seedów, hardening. |
| **Frontend** | `frontend/Dockerfile.prod` | Multi-stage build (Node -> Nginx), `HEALTHCHECK`. |
| | `frontend/nginx.conf` | **[NOWY]** Konfiguracja Nginx pod SPA (routing `try_files`). |
| | `frontend/.env.production.example` | **[NOWY]** Szablon zmiennych dla Vite na produkcji. |
| **STT Service** | `stt-service/Dockerfile.prod` | Pre-download modelu Whisper, `HEALTHCHECK`. |
| | `stt-service/.env.production.example` | **[NOWY]** Szablon zmiennych dla serwisu STT. |
| **Infrastruktura** | `docker-compose.prod.yml` | **[NOWY]** Cały stack w trybie produkcyjnym do testów lokalnych. |
| | `.gitignore` | Zaktualizowane reguły dla sekretów i plików `.env`. |
| **Dokumentacja** | `docs/azure-deployment.md` | **[NOWY]** Przewodnik wdrożenia krok po kroku (ACA, ACR, MySQL). |
| | `docs/azure-env.md` | **[NOWY]** Pełna lista wymaganych zmiennych środowiskowych. |

## 2. Krytyczne zmiany (Must-Have dla Deploya)

Poniższe elementy są kluczowe, aby aplikacja działała poprawnie i bezpiecznie na Azure:

### A. Backend Hardening (`application-prod.yaml`)
Wymuszenie obecności zmiennych bez fallbacków dla `JWT_SECRET_KEY` i `DB_PASSWORD`. Jeśli ich nie ustawisz w Azure, aplikacja słusznie zfailuje przy starcie zamiast użyć niebezpiecznych domyślnych wartości.

### B. Dynamiczny CORS (`SecurityConfig.java`)
Standardowo projekt miał hardkodowane originy. Nowa zmiana pozwala przekazać np.:
`CORS_ALLOWED_ORIGINS=https://freeedu.pl,https://www.freeedu.pl`

### C. Nginx dla Frontendu (`frontend/Dockerfile` + `nginx.conf`)
Azure Container Apps wymaga serwera HTTP. Zastosowany Nginx z regułą `try_files` zapewnia poprawne działanie SPA.

### D. STT Model Pre-loading (`stt-service/Dockerfile`)
Model Whisper jest częścią obrazu, co przyspiesza start kontenera i zapobiega timeoutom health checków.
