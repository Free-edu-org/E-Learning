# Frontend - Wyniki Lekcji

Widok wyników lekcji pozwala nauczycielowi przejrzeć statystyki i indywidualne wyniki uczniów dla wybranej lekcji.

Route: `/teacher/lessons/:lessonPublicId/stats`

## Sekcje widoku

- **Nagłówek** — przycisk Powrót, tytuł "Wyniki lekcji", podtytuł z nazwą lekcji
- **Karty statystyk** — Średni wynik (%), Uczniowie którzy ukończyli (liczba), Najlepszy wynik (%)
- **Wykres "Wyniki uczniów"** — słupki per uczeń, posortowane malejąco (fioletowe, recharts)
- **Wykres "Rozkład wyników"** — liczba uczniów w przedziałach 0-20%, 20-40%, 40-60%, 60-80%, 80-100% (zielone)
- **Tabela szczegółowych wyników** — imię ucznia, data ukończenia, Punkty (X/Y), Procent (kolor zależny od wyniku), przycisk Zobacz profil

## Dane

Endpoint: `GET /api/v1/teacher/lessons/{lessonPublicId}/stats`

Odpowiedź:
```json
{
  "avgScore": 80.0,
  "studentsCompleted": 5,
  "bestScore": 100.0,
  "studentResults": [
    {
      "userPublicId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "jan_kowalski",
      "completedAt": "2026-01-20T12:00:00",
      "score": 8,
      "maxScore": 10,
      "resultPercent": 80.0
    }
  ]
}
```

Kolory procentów:
- >= 80% → zielony
- 60-79% → żółty
- < 60% → czerwony

## Nawigacja

Dostęp przez przycisk **Wyniki** na karcie lekcji w [[Frontend - Teacher Dashboard]].

Połączenia:
- [[Teacher Dashboard]]
- [[Frontend - Teacher Dashboard]]
- [[Domena - lekcje]]
- [[Domena - postęp studenta]]
- [[Rola - Teacher]]

Źródła:
- [LessonStatsView.tsx](../../frontend/src/features/teacher/LessonStatsView.tsx)
- [LessonCard.tsx](../../frontend/src/components/teacher/LessonCard.tsx)
- [lessonService.ts](../../frontend/src/api/lessonService.ts)
- [TeacherDashboardController.java](../../backend/src/main/java/pl/freeedu/backend/teacher/controller/v1/TeacherDashboardController.java)
- [LessonStatsResponse.java](../../backend/src/main/java/pl/freeedu/backend/teacher/dto/LessonStatsResponse.java)
- [LessonStatsStudentResult.java](../../backend/src/main/java/pl/freeedu/backend/teacher/dto/LessonStatsStudentResult.java)
