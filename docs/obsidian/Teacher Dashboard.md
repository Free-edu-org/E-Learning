# Teacher Dashboard

Teacher dashboard agreguje lekcje, zadania, statystyki, grupy i liste uczniow dla [[Rola - Teacher]].

Polaczenia:
- [[Frontend - Teacher Dashboard]]
- [[Frontend - Wyniki Lekcji]]
- [[Domena - lekcje]]
- [[Domena - zadania]]
- [[Domena - grupy]]
- [[Przeplyw - nauczyciel tworzy lekcje]]

Endpointy BFF:
- `GET /api/v1/teacher/stats` — totalLessons, activeLessons, activeStudents, avgScore
- `GET /api/v1/teacher/lessons` — lekcje nauczyciela
- `GET /api/v1/teacher/lessons/{lessonPublicId}/stats` — wyniki uczniow dla lekcji
- `GET /api/v1/teacher/my-groups` — grupy nauczyciela
- `GET /api/v1/teacher/students` — uczniowie w grupach nauczyciela
- `POST /api/v1/teacher/students` — tworzenie ucznia (groupPublicId wymagane)
- `PUT /api/v1/teacher/students/{studentPublicId}` — aktualizacja ucznia

Zrodla:
- [TeacherDashboardController.java](../../backend/src/main/java/pl/freeedu/backend/teacher/controller/v1/TeacherDashboardController.java)
- [TeacherService.java](../../backend/src/main/java/pl/freeedu/backend/teacher/service/TeacherService.java)
- [TeacherStatsRepository.java](../../backend/src/main/java/pl/freeedu/backend/teacher/repository/TeacherStatsRepository.java)
- [LessonStatsResponse.java](../../backend/src/main/java/pl/freeedu/backend/teacher/dto/LessonStatsResponse.java)
- [TeacherDashboard.tsx](../../frontend/src/features/teacher/TeacherDashboard.tsx)
