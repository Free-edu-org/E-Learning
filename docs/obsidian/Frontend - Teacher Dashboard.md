# Frontend - Teacher Dashboard

Panel nauczyciela sluzy do pracy na lekcjach, zadaniach, grupach i uczniach.

Widoki:
- **TeacherDashboard** — glowny panel z kartami statystyk, listą lekcji i przyciskami akcji
- **LessonCard** — karta lekcji z opcjonalna kolorowa kropka `labelColor` oraz przyciskami Edytuj, Wyniki, Usun
- **LessonStatsView** — widok wynikow lekcji (osobna strona, route `/teacher/lessons/:lessonPublicId/stats`)

Filtry lekcji:
- wyszukiwanie tekstowe
- filtr grup
- filtr kolorow lekcji, spojny wizualnie z filtrem grup i obslugujacy wiele kolorow naraz
- status aktywnosci
- sortowanie i przelacznik widoku

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
