# Domena - lekcje

Lekcja jest glownym kontenerem tresci. Nalezy do nauczyciela, moze byc aktywna lub nieaktywna, moze byc przypisana do grup, zawiera zadania z [[Domena - zadania]] i moze miec opcjonalny kolor organizacyjny `labelColor`.

Polaczenia:
- [[Rola - Teacher]] tworzy i edytuje lekcje
- [[Rola - Admin]] moze zarzadzac lekcjami
- [[Rola - Student]] widzi aktywne lekcje przypisane przez [[Domena - grupy]]
- [[Domena - postep studenta]] zapisuje stan lekcji dla ucznia
- [[Frontend - Wyniki Lekcji]] prezentuje wyniki uczniow per lekcja

Kolory organizacyjne:
- pole `labelColor` jest opcjonalne i przechowuje stabilna wartosc API, nie dowolny CSS
- dozwolone wartosci: `gray`, `red`, `orange`, `yellow`, `green`, `blue`, `purple`
- nauczyciel moze filtrowac dashboard po wielu kolorach naraz; logika dziala jak OR

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
