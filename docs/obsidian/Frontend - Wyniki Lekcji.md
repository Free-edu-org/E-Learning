# Frontend - Wyniki Lekcji

Widok wynikow lekcji pozwala nauczycielowi przejrzec statystyki i indywidualne wyniki uczniow dla wybranej lekcji.

Route: `/teacher/lessons/:lessonPublicId/stats`

## Sekcje widoku

- **Naglowek** — przycisk Powrot, tytul "Wyniki lekcji", podtytul z nazwa lekcji
- **Karty statystyk** — Sredni wynik (%), Uczniowie ktorzy ukonczyli (liczba), Najlepszy wynik (%)
- **Wykres "Wyniki uczniow"** — slupki per uczen, posortowane malejaco (fioletowe, recharts)
- **Wykres "Rozklad wynikow"** — liczba uczniow w przedzialach 0-20%, 20-40%, 40-60%, 60-80%, 80-100% (zielone)
- **Tabela szczegolowych wynikow** — imie ucznia, data ukonczenia, Punkty (X/Y), Procent (kolor zalezny od wyniku), przycisk Zobacz profil

## Dane

Endpoint: `GET /api/v1/teacher/lessons/{lessonPublicId}/stats`

Odpowiedz:
```json
{
  "avgScore": 80.0,
  "studentsCompleted": 5,
  "bestScore": 100.0,
  "studentResults": [
    {
      "userPublicId": 8,
      "username": "jan_kowalski",
      "completedAt": "2026-01-20T12:00:00",
      "score": 8,
      "maxScore": 10,
      "resultPercent": 80.0
    }
  ]
}
```

Kolory procentow:
- >= 80% → zielony
- 60-79% → zolty
- < 60% → czerwony

## Nawigacja

Dostep przez przycisk **Wyniki** na karcie lekcji w [[Frontend - Teacher Dashboard]].

Polaczenia:
- [[Teacher Dashboard]]
- [[Frontend - Teacher Dashboard]]
- [[Domena - lekcje]]
- [[Domena - postep studenta]]
- [[Rola - Teacher]]

Zrodla:
- [LessonStatsView.tsx](../../frontend/src/features/teacher/LessonStatsView.tsx)
- [LessonCard.tsx](../../frontend/src/components/teacher/LessonCard.tsx)
- [lessonService.ts](../../frontend/src/api/lessonService.ts)
- [TeacherDashboardController.java](../../backend/src/main/java/pl/freeedu/backend/teacher/controller/v1/TeacherDashboardController.java)
- [LessonStatsResponse.java](../../backend/src/main/java/pl/freeedu/backend/teacher/dto/LessonStatsResponse.java)
- [LessonStatsStudentResult.java](../../backend/src/main/java/pl/freeedu/backend/teacher/dto/LessonStatsStudentResult.java)
