import os
import json
import logging
import re
import tempfile
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from faster_whisper import WhisperModel
from pydantic import BaseModel

app = FastAPI(title="FreeEdu STT Service")
logger = logging.getLogger("freeedu.stt")

MODEL_SIZE = os.getenv("STT_MODEL_SIZE", "base")
DEVICE = os.getenv("STT_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("STT_COMPUTE_TYPE", "int8")
LANGUAGE = os.getenv("STT_LANGUAGE", "en")
MAX_AUDIO_BYTES = int(os.getenv("STT_MAX_AUDIO_BYTES", str(25 * 1024 * 1024)))
STT_NORMALIZATION_PATH = Path(__file__).with_name("stt-normalization.json")


class SpeakWordResult(BaseModel):
    expected: str
    actual: str
    correct: bool


class EvaluationResponse(BaseModel):
    rawTranscription: str
    matchedTranscription: str
    expectedText: str
    normalizedExpected: str
    normalizedActual: str
    score: float
    correct: bool
    words: list[SpeakWordResult]
    language: Optional[str] = None
    duration: Optional[float] = None


def load_stt_normalization_rules() -> tuple[
    set[str], dict[str, str], dict[str, set[str]]
]:
    with STT_NORMALIZATION_PATH.open(encoding="utf-8") as file:
        raw_rules = json.load(file)

    filler_words = set(raw_rules.get("fillerWords", []))
    contractions = dict(raw_rules.get("contractions", {}))
    word_variants = {
        word: set(variants)
        for word, variants in raw_rules.get("wordVariants", {}).items()
    }
    return filler_words, contractions, word_variants


STT_FILLER_WORDS, STT_CONTRACTIONS, STT_WORD_VARIANTS = load_stt_normalization_rules()


@lru_cache(maxsize=1)
def get_model() -> WhisperModel:
    return WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)


def null_to_empty(value: Optional[str]) -> str:
    return value or ""


def strip_bracketed_content(value: str, opening: str, closing: str) -> str:
    result: list[str] = []
    depth = 0

    for char in value:
        if char == opening:
            if depth == 0:
                result.append(" ")
            depth += 1
            continue

        if char == closing and depth > 0:
            depth -= 1
            continue

        if depth == 0:
            result.append(char)

    return "".join(result)


def remove_space_before_apostrophe(value: str) -> str:
    result: list[str] = []

    for char in value:
        if char == "'" and result:
            while result and result[-1].isspace():
                result.pop()
        result.append(char)

    return "".join(result)


def normalize_text(value: Optional[str]) -> str:
    if value is None:
        return ""

    normalized = value.lower()
    normalized = strip_bracketed_content(normalized, "[", "]")
    normalized = strip_bracketed_content(normalized, "(", ")")
    normalized = remove_space_before_apostrophe(normalized)
    for contraction, expansion in STT_CONTRACTIONS.items():
        normalized = re.sub(rf"\b{re.escape(contraction)}\b", expansion, normalized)

    normalized = unicodedata.normalize("NFKD", normalized)
    normalized = "".join(
        char for char in normalized if unicodedata.category(char) != "Mn"
    )
    normalized = normalized.replace("ł", "l")
    normalized = re.sub(r"[^\w\s]", " ", normalized, flags=re.UNICODE)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if not normalized:
        return ""

    words = [
        word for word in normalized.split(" ") if word and word not in STT_FILLER_WORDS
    ]
    return " ".join(words)


def split_normalized_words(value: Optional[str]) -> list[str]:
    normalized = normalize_text(value)
    return [] if not normalized else normalized.split(" ")


def normalize_word(value: Optional[str]) -> str:
    words = split_normalized_words(value)
    return words[0] if words else ""


def levenshtein_distance(left: str, right: str, max_distance: int) -> int:
    if abs(len(left) - len(right)) > max_distance:
        return max_distance + 1

    previous = list(range(len(right) + 1))
    current = [0] * (len(right) + 1)

    for i, left_char in enumerate(left, start=1):
        current[0] = i
        row_min = current[0]
        for j, right_char in enumerate(right, start=1):
            substitution_cost = 0 if left_char == right_char else 1
            current[j] = min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + substitution_cost,
            )
            row_min = min(row_min, current[j])
        if row_min > max_distance:
            return max_distance + 1
        previous, current = current, previous

    return previous[len(right)]


def shared_prefix_length(left: str, right: str) -> int:
    prefix = 0
    limit = min(len(left), len(right))
    while prefix < limit and left[prefix] == right[prefix]:
        prefix += 1
    return prefix


def has_high_similarity(expected_word: str, actual_word: str) -> bool:
    max_length = max(len(expected_word), len(actual_word))
    if max_length == 0:
        return False
    distance = levenshtein_distance(expected_word, actual_word, max_length)
    return 1.0 - (distance / max_length) >= 0.8


def is_safe_fuzzy_word_match(expected_word: str, actual_word: str) -> bool:
    min_length = min(len(expected_word), len(actual_word))
    if min_length <= 5:
        return False
    if expected_word[0] != actual_word[0]:
        return False

    same_last_character = expected_word[-1] == actual_word[-1]
    if max(len(expected_word), len(actual_word)) >= 6:
        distance = levenshtein_distance(expected_word, actual_word, 2)
        if distance <= 1:
            return (
                same_last_character
                or shared_prefix_length(expected_word, actual_word) >= min_length - 1
            )
        return (
            distance == 2
            and same_last_character
            and has_high_similarity(expected_word, actual_word)
        )

    return False


def is_word_match(expected_word: str, actual_word: str) -> bool:
    normalized_expected = normalize_word(expected_word)
    normalized_actual = normalize_word(actual_word)
    if not normalized_expected or not normalized_actual:
        return False
    if normalized_expected == normalized_actual:
        return True

    expected_variants = STT_WORD_VARIANTS.get(normalized_expected)
    if expected_variants and normalized_actual in expected_variants:
        return True

    actual_variants = STT_WORD_VARIANTS.get(normalized_actual)
    if actual_variants and normalized_expected in actual_variants:
        return True

    return is_safe_fuzzy_word_match(normalized_expected, normalized_actual)


def build_word_results(
    actual: Optional[str], expected: Optional[str]
) -> list[SpeakWordResult]:
    actual_words = split_normalized_words(actual)
    expected_words = split_normalized_words(expected)
    if not expected_words:
        return []

    expected_count = len(expected_words)
    actual_count = len(actual_words)
    dp = [[0] * (actual_count + 1) for _ in range(expected_count + 1)]

    for i in range(expected_count - 1, -1, -1):
        for j in range(actual_count - 1, -1, -1):
            if is_word_match(expected_words[i], actual_words[j]):
                dp[i][j] = 1 + dp[i + 1][j + 1]
            else:
                dp[i][j] = max(dp[i + 1][j + 1], dp[i + 1][j], dp[i][j + 1])

    results: list[SpeakWordResult] = []
    i = 0
    j = 0

    while i < expected_count:
        expected_word = expected_words[i]
        if j >= actual_count:
            results.append(
                SpeakWordResult(expected=expected_word, actual="", correct=False)
            )
            i += 1
            continue

        actual_word = actual_words[j]
        if is_word_match(expected_word, actual_word):
            results.append(
                SpeakWordResult(
                    expected=expected_word, actual=actual_word, correct=True
                )
            )
            i += 1
            j += 1
            continue

        insertion_score = dp[i][j + 1]
        substitution_score = dp[i + 1][j + 1]
        deletion_score = dp[i + 1][j]

        if insertion_score > substitution_score and insertion_score >= deletion_score:
            j += 1
            continue

        if substitution_score >= deletion_score:
            results.append(
                SpeakWordResult(
                    expected=expected_word, actual=actual_word, correct=False
                )
            )
            i += 1
            j += 1
            continue

        results.append(
            SpeakWordResult(expected=expected_word, actual="", correct=False)
        )
        i += 1

    return results


def calculate_score(word_results: list[SpeakWordResult]) -> float:
    if not word_results:
        return 0.0
    correct_words = sum(1 for word in word_results if word.correct)
    return correct_words / len(word_results)


def build_matched_transcription(word_results: list[SpeakWordResult]) -> str:
    return " ".join(word.actual for word in word_results if word.actual).strip()


def evaluate_transcription(
    raw_transcription: Optional[str],
    expected_text: str,
    min_score: float,
    language: Optional[str],
    duration: Optional[float],
) -> EvaluationResponse:
    safe_raw = null_to_empty(raw_transcription).strip()
    word_results = build_word_results(safe_raw, expected_text)
    score = calculate_score(word_results)
    matched_transcription = build_matched_transcription(word_results)
    result = EvaluationResponse(
        rawTranscription=safe_raw,
        matchedTranscription=matched_transcription,
        expectedText=expected_text,
        normalizedExpected=normalize_text(expected_text),
        normalizedActual=normalize_text(safe_raw),
        score=score,
        correct=score >= min_score,
        words=word_results,
        language=language,
        duration=duration,
    )
    logger.info(
        "STT evaluation finished: duration=%s, score=%s, correct=%s",
        duration,
        result.score,
        result.correct,
    )
    logger.debug(
        "STT evaluation transcriptions: raw='%s', matched='%s'",
        result.rawTranscription,
        result.matchedTranscription,
    )
    return result


def parse_expected_texts(
    expected_text: str, expected_texts: Optional[str]
) -> list[str]:
    if not expected_texts:
        return [expected_text]
    try:
        parsed = json.loads(expected_texts)
        if isinstance(parsed, list):
            texts = [str(item).strip() for item in parsed if str(item).strip()]
            return texts or [expected_text]
    except json.JSONDecodeError:
        pass
    texts = [line.strip() for line in expected_texts.splitlines() if line.strip()]
    return texts or [expected_text]


def evaluate_transcription_against_any(
    raw_transcription: Optional[str],
    expected_texts: list[str],
    min_score: float,
    language: Optional[str],
    duration: Optional[float],
) -> EvaluationResponse:
    evaluations = [
        evaluate_transcription(
            raw_transcription,
            expected_text,
            min_score,
            language,
            duration,
        )
        for expected_text in expected_texts
    ]
    return max(evaluations, key=lambda result: result.score)


async def transcribe_audio(file: UploadFile, language: Optional[str] = None) -> dict:
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
            language=language or LANGUAGE,
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
    return await transcribe_audio(file)


@app.post("/stt/evaluate", response_model=EvaluationResponse)
async def evaluate(
    file: UploadFile = File(...),
    expectedText: str = Form(...),
    expectedTexts: Optional[str] = Form(default=None),
    minScore: float = Form(...),
    language: Optional[str] = Form(default=None),
):
    transcription = await transcribe_audio(file, language)
    return evaluate_transcription_against_any(
        transcription["text"],
        parse_expected_texts(expectedText, expectedTexts),
        minScore,
        transcription["language"],
        transcription["duration"],
    )
