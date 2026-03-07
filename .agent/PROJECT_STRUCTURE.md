# Project Structure Mapping - FreeEdu

**UWAGA AGENCIE:** Skup się wyłącznie na kodzie źródłowym. Ignoruj: `node_modules`, `.venv`, `.idea`, `target`.

## 1. Architektura Mikroserwisów
- `/` - Root projektu (często zawiera frontend).
- `/backend` - Główny serwis Spring Boot.
- `/stt-service` - Mikroserwis Pythona (Whisper STT).
- `/frontend` - Główny serwis frontend.

## 2. Szczegóły Lokalizacji

### 🔵 Frontend (React 19)
- `/src/components` - Komponenty współdzielone UI (Material UI @mui).
- `/src/features` - Logika biznesowa podzielona na domeny (np. `/lessons`, `/exercises`).
- `/src/hooks` - Globalne hooki (wykorzystujące React 19 `use`).

### 🟢 Backend (Java 25)
- `/src/main/java/pl/freeedu/backend` - Logika aplikacji.
- `/src/main/resources/db/migration` - Skrypty Flyway (MySQL).
- **Ważne:** Wszystkie wywołania JPA muszą być owinięte w:
  `Mono.fromCallable(() -> ...).subscribeOn(Schedulers.boundedElastic())`

### 🟡 STT Service (Python)
- `/stt-service/app.py` - Punkt wejścia API.
- Lokalizacja skryptów obsługujących model Whisper.

## 3. Restrykcje
- Nie twórz nowych folderów technicznych w root bez zgody.
- Jeśli dodajesz funkcjonalność STT, musi ona trafić do `/stt-service`.
- Utrzymuj nazewnictwo plików zgodne z istniejącą konwencją (CamelCase dla klas/komponentów).