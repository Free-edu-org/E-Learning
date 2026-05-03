# Przeplyw - student rozwiazuje lekcje

```mermaid
sequenceDiagram
  participant S as Student
  participant F as Lesson Solver
  participant API as Task API
  participant DB as MySQL
  S->>F: otwiera lekcje
  F->>API: GET /api/v1/lessons/{lessonPublicId}/tasks
  API->>DB: sprawdz dostep przez grupe
  API->>DB: utworz lub pobierz user_lessons
  API-->>F: zadania bez odpowiedzi poprawnych
  S->>F: wysyla odpowiedzi
  F->>API: POST /api/v1/lessons/{lessonPublicId}/submit
  API->>DB: user_answers + user_lessons COMPLETED
  API-->>F: wynik i detale
```

Wezly:
- [[Rola - Student]]
- [[Frontend - Lesson Solver]]
- [[Domena - grupy]]
- [[Domena - lekcje]]
- [[Domena - zadania]]
- [[Domena - postep studenta]]

Reguly:
- student musi miec dostep do lekcji przez grupe
- lekcja musi byc aktywna
- zakonczona lekcja nie moze byc rozwiazywana ponownie bez resetu

Zrodla:
- [TaskService.java](../../backend/src/main/java/pl/freeedu/backend/task/service/TaskService.java)
- [LessonSolver.tsx](../../frontend/src/features/student/LessonSolver.tsx)
