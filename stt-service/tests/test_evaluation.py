import io
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app, evaluate_transcription


class EvaluationLogicTest(unittest.TestCase):
    def test_should_match_prefixed_sentence_with_known_variant(self):
        result = evaluate_transcription(
            "cos My name is Dominic", "My name is Dominik", 0.85, "en", 1.8
        )

        self.assertEqual(1.0, result.score)
        self.assertTrue(result.correct)
        self.assertEqual("my name is dominic", result.matchedTranscription)

    def test_should_not_accept_wrong_word_order(self):
        result = evaluate_transcription(
            "Dominik is my name", "My name is Dominik", 0.85, "en", 1.8
        )

        self.assertFalse(result.correct)
        self.assertLess(result.score, 1.0)

    def test_should_ignore_fillers(self):
        result = evaluate_transcription(
            "um My name is Dominic", "My name is Dominik", 0.85, "en", 1.8
        )

        self.assertEqual(1.0, result.score)
        self.assertTrue(result.correct)

    def test_should_match_dominik_and_dominic(self):
        result = evaluate_transcription("Dominic", "Dominik", 0.85, "en", 1.8)

        self.assertEqual(1.0, result.score)
        self.assertTrue(result.correct)

    def test_should_not_fuzzy_match_short_words(self):
        result_one = evaluate_transcription("it", "is", 0.85, "en", 1.8)
        result_two = evaluate_transcription("me", "my", 0.85, "en", 1.8)

        self.assertEqual(0.0, result_one.score)
        self.assertFalse(result_one.correct)
        self.assertEqual(0.0, result_two.score)
        self.assertFalse(result_two.correct)


class EvaluateEndpointTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.main.transcribe_audio", new_callable=AsyncMock)
    def test_should_return_evaluation_payload(self, mock_transcribe_audio):
        mock_transcribe_audio.return_value = {
            "text": "cos My name is Dominic",
            "language": "en",
            "duration": 1.8,
        }

        response = self.client.post(
            "/stt/evaluate",
            files={"file": ("answer.webm", io.BytesIO(b"audio"), "audio/webm")},
            data={
                "expectedText": "My name is Dominik",
                "minScore": "0.85",
            },
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(
            {
                "rawTranscription",
                "matchedTranscription",
                "normalizedExpected",
                "normalizedActual",
                "score",
                "correct",
                "words",
                "language",
                "duration",
            },
            set(payload.keys()),
        )
        self.assertEqual("cos My name is Dominic", payload["rawTranscription"])
        self.assertEqual("my name is dominic", payload["matchedTranscription"])
        self.assertEqual(1.0, payload["score"])
        self.assertTrue(payload["correct"])
        self.assertEqual(4, len(payload["words"]))
        self.assertEqual(
            {"expected", "actual", "correct"}, set(payload["words"][0].keys())
        )


if __name__ == "__main__":
    unittest.main()
