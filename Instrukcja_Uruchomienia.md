# Instrukcja Uruchomienia Projektu Inżynierskiego "FreeEdu"

Niniejsza instrukcja opisuje proces uruchomienia platformy e-learningowej z dostarczonych kodów źródłowych. 
Najprostszym i zalecanym sposobem uruchomienia całego środowiska (baza danych, backend, frontend) jest wykorzystanie narzędzia **Docker** oraz **Docker Compose**.

## Wymagania wstępne
- Zainstalowany **Docker** oraz **Docker Compose** (np. aplikacja Docker Desktop w systemie Windows/macOS lub pakiety docker-ce i docker-compose-plugin w systemie Linux).
- Połączenie z internetem (do pobrania podstawowych obrazów Dockera i zależności podczas budowania).
- Porty na komputerze hosta, które nie mogą być zajęte: `5173` (frontend), `8080` (backend API), `3306` (MySQL), `8000` (STT Service).

## 1. Przygotowanie zmiennych środowiskowych

Projekt wymaga plików konfiguracyjnych `.env` do poprawnego uruchomienia. W dostarczonym kodzie znajdują się szablony tych plików o nazwie `.env.example`.

Przed uruchomieniem projektu powiel szablony i zapisz je pod nazwą `.env` w odpowiednich katalogach. Otwórz terminal w głównym katalogu projektu i wykonaj instrukcje:

**Dla systemu Windows (PowerShell):**
```powershell
Copy-Item .env.example -Destination .env
Copy-Item backend\.env.example -Destination backend\.env
Copy-Item frontend\.env.example -Destination frontend\.env
```

**Dla systemów Linux / macOS:**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

*Uwaga: Hasła i konfiguracja w plikach `.env` są domyślnie dostosowane do środowiska developerskiego, więc nie ma potrzeby ich modyfikować do samego uruchomienia na obronę.*

## 2. Zbudowanie backendu i uruchomienie platformy

Zanim podniesiesz kontenery Dockera, musisz zbudować aplikację backendową (Java), co wygeneruje niezbędny plik `.jar` w folderze `target`.
Będąc w głównym katalogu projektu, wykonaj:

**Dla systemu Windows (PowerShell/CMD):**
```powershell
cd backend
.\mvnw.cmd clean package -DskipTests
cd ..
```

**Dla systemów Linux / macOS (lub Git Bash):**
```bash
cd backend
./mvnw clean package -DskipTests
cd ..
```

Gdy pliki `.env` są gotowe oraz backend został zbudowany, pozostając w głównym katalogu projektu uruchom w terminalu poniższą komendę:

```bash
docker-compose up -d --build
```

Flaga `--build` zbuduje obrazy kontenerów na podstawie dostarczonego na płycie kodu źródłowego (frontendu i backendu). 
> **Ważne:** Pierwsze uruchomienie pobierze wszystkie niezbędne biblioteki oraz pakiety Maven i NPM (dzięki czemu nie znajdują się one na samej płycie CD). Proces ten zajmuje zazwyczaj około 3-8 minut.

Po zakończeniu budowania można sprawdzić, czy wszystkie kontenery uruchomiły się poprawnie:
```bash
docker-compose ps
```

## 3. Dostęp do platformy

Po pomyślnym uruchomieniu środowiska, aplikacja (frontend) jest dostępna w przeglądarce pod adresem:
**http://localhost:5173**

*(Uwaga: Backend API znajduje się pod adresem http://localhost:8080)*

### Dane testowe (konta użytkowników)
Do bazy danych zostały automatycznie załadowane konta testowe (seed), których można użyć od razu do zaprezentowania funkcjonalności platformy:

- **Administrator:**
  - Login (email): `admin@szkola.pl`
  - Hasło: `admin1`
- **Nauczyciel:**
  - Login: `pan_tomasz`
  - Hasło: `admin1`
- **Uczeń:**
  - Login: `student1@edu.pl` (oraz `student2@edu.pl`)
  - Hasło: `student1` (odpowiednio: `student2`)

## 4. Zatrzymanie platformy

Aby zatrzymać działanie aplikacji (bez utraty danych z bazy MySQL), wykonaj komendę w głównym katalogu:
```bash
docker-compose stop
```

Jeżeli chcesz wyczyścić środowisko całkowicie (zatrzymać kontenery oraz **usunąć** stworzoną bazę danych), wykonaj:
```bash
docker-compose down -v
```

---
*Uwaga techniczna: W razie potrzeby przejrzenia błędów, można skorzystać z komendy `docker-compose logs -f` aby w czasie rzeczywistym podglądać logi całego systemu.*
