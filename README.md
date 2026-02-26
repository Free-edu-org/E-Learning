# FreeEdu - Platforma E-Learningowa

Witamy w repozytorium **FreeEdu**! Jest to platforma typu E-Learning oparta o nowoczesną architekturę.

## Stack Technologiczny
- **Backend**: Java 25, Spring Boot 4.0.1 (WebFlux), MySQL, Flyway
- **Frontend**: React 19 (Strict Mode), Vite, Material UI

---

## 🚀 Szybki Start

Do pełnego i najszybszego uruchomienia środowiska developerskiego (baza danych testowa lub pełne środowisko) najlepiej wykorzystać **Docker**.

### 1. Przygotowanie plików `.env`

Przed pierwszym uruchomieniem musisz utworzyć pliki ukryte z danymi środowiskowymi na podstawie dostarczonych przykładów.
Otwórz terminal w głównym katalogu projektu i wykonaj poniższe komendy w zależności od używanego systemu:

**Linux / macOS (lub Git Bash na Windowsie):**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Windows PowerShell:**
```powershell
Copy-Item .env.example -Destination .env
Copy-Item backend\.env.example -Destination backend\.env
Copy-Item frontend\.env.example -Destination frontend\.env
```

*Następnie upewnij się, że odpowiednio uzupełniłeś lub zweryfikowałeś wartości (np. hasła do DB i klucze JWT) w wygenerowanych plikach `.env`.*

### 2. Uruchomienie platformy (Docker Compose)

Teraz możesz podnieść kontenery w tle używając polecenia:
```bash
docker-compose up -d
```

Zatrzymanie kontenerów (bez usuwania danych z bazy MySQL ograniczonych do wolumenu):
```bash
docker-compose stop
```

---

## 🛠 Extra Komendy (Przydatne w Developmentie)

Poniżej zebrano komendy bardzo przydatne przy twardym resecie lub wymuszonym przebudowaniu kontenerów:

**1. Force Rebuild (Przebudowanie wszystkich obrazów)**  
Gdy dodajesz nową paczkę w `package.json`, modyfikujesz `Dockerfile` czy zmieniasz kluczowe zależności backendowe:
```bash
docker-compose up -d --build
```
*Ta komenda ignoruje stary cache i buduje obrazy na nowo.*

**2. Zniszczenie i usunięcie WSZYSTKIEGO**  
Jeżeli chcesz rozpocząć pracę z całkowicie czystym środowiskiem, bez starych danych z bazy `freeedu`, bez wolumenów i starych obrazów dockera, wpisz:
```bash
docker-compose down -v --rmi all
```
*Uwaga! Wywołanie `-v` bezpowrotnie usuwa przypięte lokalnie dane bazodanowe! Po tej komendzie system wystartuje jako kompletnie czysty po kolejnym użyciu `up`.*

---

## 💻 Uruchamianie LOKALNE (Dla IDE bez pełnego Dockera)

Jeżeli w Dockerze wolisz odpalić tylko bazę, a aplikacje odpalać z terminali dla debugowania:
1. Uruchom tylko bazę: `docker-compose up -d mysql` (lub jakkolwiek nazwano serwis DB w compose).

**Backend (Java):**
```bash
cd backend
./mvnw clean compile
./mvnw spring-boot:run
```

**Frontend (React):**
```bash
cd frontend
npm install
npm run dev
```