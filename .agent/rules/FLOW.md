---
trigger: always_on
---

# OPERATIONAL FLOW (ALWAYS FOLLOW):
1. [READ] Przeskanuj PROJECT_STRUCTURE.md, aby zlokalizować odpowiednie moduły.
2. [THINK] Przeanalizuj, czy zmiana wymaga modyfikacji bazy danych (Flyway) lub API.
3. [CHECK] Jeśli zadanie dotyczy STT, sprawdź istniejące funkcje w /stt-service.
4. [ASK] Jeśli brakuje typu danych, makiety lub szczegółów logiki - ZAPYTAJ przed pisaniem kodu.
5. [EXECUTE] Wykonaj zmianę, stosując MapStruct (Backend) i nowe hooki React 19 (Frontend).
6. [VERIFY] Upewnij się, że nie dodałeś nowych zależności bez pytania.