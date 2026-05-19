# STT Speaking Flow

## Runtime flow

1. Frontend nagrywa audio dla zadania `speak`.
2. Frontend wysyła audio do backendu przez `POST /api/v1/lessons/{lessonPublicId}/tasks/speak/{taskPublicId}/transcribe`.
3. Backend:
   - waliduje użytkownika, dostęp do lekcji i status lekcji,
   - pobiera `expectedText` z `SpeakTask`,
   - znajduje aktywny `UserLesson`,
   - sprawdza limit attemptów per `userLesson + task`,
   - woła `stt-service` przez `POST /stt/evaluate`.
4. `stt-service` wykonuje pełne evaluation:
   - transkrypcję audio,
   - normalizację,
   - dopasowanie do `expectedText`,
   - scoring,
   - `correct`,
   - `words[]`,
   - `rawTranscription` i `matchedTranscription`.
5. Backend zapisuje immutable `SpeakAttempt` przypięty do konkretnego `UserLesson` i `SpeakTask`.
6. Backend zwraca frontendowi:
   - `attemptId`,
   - `text = matchedTranscription`,
   - `rawText = rawTranscription`,
   - `score`,
   - `correct`,
   - `words[]`.
7. Frontend przy końcowym submit lekcji wysyła `attemptId` dla speaking tasków, które mają zostać ocenione na podstawie STT.
8. Backend waliduje `attemptId` względem:
   - użytkownika,
   - zadania,
   - lekcji,
   - bieżącego `UserLesson`,
   - stanu reset/completed.
9. Backend używa `score/correct` z `SpeakAttempt` i nie liczy STT ponownie.

## Important business rules

- `SpeakAttempt` jest przypięty do konkretnego `UserLesson`, więc nie może zostać użyty po resecie ani w nowym podejściu do lekcji.
- Speaking task może zostać pominięty przez użytkownika.
- Brak `attemptId` nie blokuje submitu całej lekcji, jeśli użytkownik pomija speaking task.
- Jeśli speaking task jest pominięty albo frontend próbuje wysłać sam tekst bez `attemptId`, backend traktuje to jako unanswered/incorrect/0 pkt dla tego taska.
- `attemptId` jest wymagany tylko wtedy, gdy speaking task ma być zaliczony na podstawie STT.
- Cleanup usuwa stare nieużyte attempty (`submittedAt IS NULL`) starsze niż retention.
- Limit attemptów działa per `userLesson + task`.
