# Frontend - Teacher Dashboard

Panel nauczyciela sluzy do pracy na lekcjach, zadaniach, grupach i uczniach.

Widoki:
- **TeacherDashboard** — glowny panel z kartami statystyk, listą lekcji i przyciskami akcji
- **LessonCard** — karta lekcji z przyciskami Edytuj, Wyniki, Usuń
- **LessonStatsView** — widok wynikow lekcji (osobna strona, route `/teacher/lessons/:lessonPublicId/stats`)

Polaczenia:
- [[Rola - Teacher]]
- [[Teacher Dashboard]]
- [[Frontend - Wyniki Lekcji]]
- [[Domena - lekcje]]
- [[Domena - zadania]]
- [[Domena - grupy]]
- [[Przeplyw - nauczyciel tworzy lekcje]]

Zrodla:
- [TeacherDashboard.tsx](../../frontend/src/features/teacher/TeacherDashboard.tsx)
- [TeacherStudentsView.tsx](../../frontend/src/features/teacher/TeacherStudentsView.tsx)
- [LessonCard.tsx](../../frontend/src/components/teacher/LessonCard.tsx)
