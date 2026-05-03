# Przeplyw - rozpoznawanie mowy

```mermaid
sequenceDiagram
  participant S as Student
  participant F as SpeakTaskSolver
  participant B as Backend Task API
  participant C as SttClient
  participant STT as STT Service
  S->>F: nagrywa audio
  F->>B: multipart POST /tasks/speak/{taskPublicId}/transcribe
  B->>B: sprawdz dostep i aktywnosc lekcji
  B->>C: przekaz FilePart
  C->>STT: POST /stt/transcribe
  STT-->>C: text, language, duration
  C-->>B: SttTranscriptionResponse
  B-->>F: wynik podobienstwa i slowa
```

Wezly:
- [[Frontend - Lesson Solver]]
- [[Domena - zadania]]
- [[Domena - postep studenta]]
- [[STT Service]]
- [[Docker i runtime]]

Reguly:
- tylko student wywoluje endpoint transkrypcji
- student musi miec dostep do lekcji
- lekcja musi byc aktywna
- backend porownuje transkrypcje z `expectedText`

Zrodla:
- [SpeakTaskSolver.tsx](../../frontend/src/components/student/SpeakTaskSolver.tsx)
- [SttClient.java](../../backend/src/main/java/pl/freeedu/backend/task/service/SttClient.java)
- [main.py](../../stt-service/app/main.py)
