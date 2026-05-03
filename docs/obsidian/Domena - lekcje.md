# Domena - lekcje

Lekcja jest glownym kontenerem tresci. Nalezy do nauczyciela, moze byc aktywna lub nieaktywna, moze byc przypisana do grup i zawiera zadania z [[Domena - zadania]].

Polaczenia:
- [[Rola - Teacher]] tworzy i edytuje lekcje
- [[Rola - Admin]] moze zarzadzac lekcjami
- [[Rola - Student]] widzi aktywne lekcje przypisane przez [[Domena - grupy]]
- [[Domena - postep studenta]] zapisuje stan lekcji dla ucznia
- [[Frontend - Wyniki Lekcji]] prezentuje wyniki uczniow per lekcja

Endpointy:
- `GET /api/v1/lessons`
- `POST /api/v1/lessons`
- `PUT /api/v1/lessons/{lessonPublicId}`
- `PATCH /api/v1/lessons/{lessonPublicId}/status`
- `DELETE /api/v1/lessons/{lessonPublicId}`
- `GET /api/v1/teacher/lessons/{lessonPublicId}/stats` — statystyki wynikow uczniow dla lekcji

Zrodla:
- [LessonController.java](../../backend/src/main/java/pl/freeedu/backend/lesson/controller/LessonController.java)
- [LessonService.java](../../backend/src/main/java/pl/freeedu/backend/lesson/service/LessonService.java)
- [Lesson.java](../../backend/src/main/java/pl/freeedu/backend/lesson/model/Lesson.java)
