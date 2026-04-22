# STT Service

STT Service to osobna aplikacja FastAPI uzywana przez [[Backend]] przy zadaniach typu `speak`.

Endpointy:
- `GET /health`
- `POST /stt/transcribe`

Runtime:
- model: `faster-whisper`
- konfiguracja przez env: `STT_MODEL_SIZE`, `STT_DEVICE`, `STT_COMPUTE_TYPE`, `STT_LANGUAGE`
- limit audio: `STT_MAX_AUDIO_BYTES`, domyslnie 25 MB

Polaczenia:
- [[Docker i runtime]] uruchamia kontener `stt-service`
- [[Backend]] ma `application.stt.base-url`
- [[Domena - zadania]] wywoluje `SttClient`
- [[Przeplyw - rozpoznawanie mowy]] opisuje pelny tor audio

Zrodla:
- [main.py](../../stt-service/app/main.py)
- [SttClient.java](../../backend/src/main/java/pl/freeedu/backend/task/service/SttClient.java)
- [docker-compose.yml](../../docker-compose.yml)
