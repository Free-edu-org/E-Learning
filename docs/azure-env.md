# Konfiguracja Środowiskowa Azure

Dokument zawiera opis wszystkich zmiennych środowiskowych wymaganych do poprawnego działania aplikacji FreeEdu w środowisku produkcyjnym Azure.

> [!IMPORTANT]
> Prawdziwe wartości sekretów (hasła, klucze) należy ustawiać wyłącznie w panelu Azure (App Service -> Configuration) lub w GitHub Secrets. **Nigdy nie dodawaj ich do repozytorium.**

## 1. Backend (Spring Boot)

Zmienne wykorzystywane przez profil `prod` (plik `application-prod.yaml`).

| Zmienna | Opis | Przykład / Uwagi |
| :--- | :--- | :--- |
| `DB_HOST` | Host bazy danych MySQL | `freeedu-db.mysql.database.azure.com` |
| `DB_PORT` | Port bazy danych | `3306` |
| `DB_NAME` | Nazwa bazy danych | `freeedu` |
| `DB_USER` | Użytkownik bazy danych | `admin_user` |
| `DB_PASSWORD` | Hasło do bazy danych | *Sekret* |
| `JWT_SECRET_KEY` | Klucz do podpisywania tokenów JWT | Min. 64 znaki, Base64 |
| `JWT_EXPIRATION` | Czas ważności tokenu (ms) | `86400000` (24h) |
| `FRONTEND_BASE_URL` | Publiczny URL frontendu | `https://freeedu.pl` |
| `STT_BASE_URL` | URL usługi Speech-to-Text | `http://stt-service:8000` |
| `CORS_ALLOWED_ORIGINS` | Lista dozwolonych originów | `https://freeedu.pl,https://www.freeedu.pl` |
| `MAIL_ENABLED` | Czy wysyłanie maili jest aktywne | `true` |
| `MAIL_HOST` | Host serwera SMTP | `smtp.sendgrid.net` |
| `MAIL_PORT` | Port SMTP | `587` |
| `MAIL_USERNAME` | Login SMTP | `apikey` |
| `MAIL_PASSWORD` | Hasło/Klucz SMTP | *Sekret* |

## 2. Frontend (React / Vite)

Zmienne definiowane podczas budowania aplikacji (plik `.env.production`).

| Zmienna | Opis | Przykład |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Adres URL API backendu | `https://api.freeedu.pl` |

## 3. STT Service (FastAPI)

| Zmienna | Opis | Przykład |
| :--- | :--- | :--- |
| `PORT` | Port na którym nasłuchuje usługa | `8000` |
| `STT_MODEL_SIZE` | Rozmiar modelu Whisper | `base`, `small`, `medium` |
| `STT_LANGUAGE` | Domyślny język rozpoznawania | `pl` lub `en` |

## 4. Database (Azure MySQL)

Zalecane ustawienia dla bazy MySQL na Azure:
- Tier: `Flexible Server`, `B1ms` (najtańszy).
- SSL: Włączone (`useSSL=true` w connection stringu).

## 5. Storage

Obecnie aplikacja korzysta z lokalnego systemu plików (`/home/LogFiles` i folder `uploads`). 
- **Logi:** Przekierowane do standardowej ścieżki logów Azure App Service.
- **Uploady:** Wymagają trwałego wolumenu (Azure Files) lub migracji na Azure Blob Storage w przyszłości.
