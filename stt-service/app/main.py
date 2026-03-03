from fastapi import FastAPI

app = FastAPI(title="FreeEdu STT Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/stt/transcribe")
def transcribe():
    # TODO: przyjmowanie audio i STT (Whisper)
    return {"text": "mock transcription"}
