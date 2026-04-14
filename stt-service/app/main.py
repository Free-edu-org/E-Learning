import os
import tempfile
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from faster_whisper import WhisperModel

app = FastAPI(title="FreeEdu STT Service")

MODEL_SIZE = os.getenv("STT_MODEL_SIZE", "base")
DEVICE = os.getenv("STT_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("STT_COMPUTE_TYPE", "int8")
LANGUAGE = os.getenv("STT_LANGUAGE", "en")
MAX_AUDIO_BYTES = int(os.getenv("STT_MAX_AUDIO_BYTES", str(25 * 1024 * 1024)))


@lru_cache(maxsize=1)
def get_model() -> WhisperModel:
    return WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "computeType": COMPUTE_TYPE,
    }


@app.post("/stt/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio = await file.read()
    if not audio:
        raise HTTPException(status_code=400, detail="Audio file is required")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file is too large")

    suffix = Path(file.filename or "answer.webm").suffix or ".webm"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(audio)
            temp_path = temp_file.name

        segments, info = get_model().transcribe(
            temp_path,
            language=LANGUAGE,
            vad_filter=True,
            beam_size=5,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return {
            "text": text,
            "language": info.language,
            "duration": info.duration,
        }
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
