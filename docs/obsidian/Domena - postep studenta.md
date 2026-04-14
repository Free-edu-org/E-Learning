# Domena - postep studenta

Postep studenta laczy [[Rola - Student]], [[Domena - lekcje]] i [[Domena - zadania]].

Tabele:
- `user_lessons`: stan lekcji, wynik, maksymalny wynik, start i koniec
- `user_answers`: pojedyncze odpowiedzi do zadan

Cykl zycia:
1. Student otwiera lekcje przez [[Frontend - Lesson Solver]].
2. Backend tworzy `user_lessons` ze statusem `IN_PROGRESS`, jezeli wpis jeszcze nie istnieje.
3. Student wysyla odpowiedzi przez `POST /api/v1/lessons/{lessonId}/submit`.
4. Backend liczy wynik, zapisuje `user_answers`, ustawia `COMPLETED`.
5. Nauczyciel lub admin moze zresetowac postep ucznia dla lekcji.

Powiazane przeplywy:
- [[Przeplyw - student rozwiazuje lekcje]]
- [[Przeplyw - rozpoznawanie mowy]]

Zrodla:
- [UserLesson.java](../../backend/src/main/java/pl/freeedu/backend/task/model/UserLesson.java)
- [UserAnswer.java](../../backend/src/main/java/pl/freeedu/backend/task/model/UserAnswer.java)
- [TaskService.java](../../backend/src/main/java/pl/freeedu/backend/task/service/TaskService.java)
