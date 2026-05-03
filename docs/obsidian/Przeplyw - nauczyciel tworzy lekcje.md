# Przeplyw - nauczyciel tworzy lekcje

```mermaid
sequenceDiagram
  participant T as Teacher
  participant F as Teacher Dashboard
  participant L as Lesson API
  participant Task as Task API
  participant DB as MySQL
  T->>F: tworzy lekcje
  F->>L: POST /api/v1/lessons
  L->>DB: lessons
  T->>F: dodaje zadania
  F->>Task: POST /api/v1/lessons/{lessonPublicId}/tasks/{type}
  Task->>DB: choose/write/scatter/speak_tasks
```

Wezly:
- [[Rola - Teacher]]
- [[Frontend - Teacher Dashboard]]
- [[Teacher Dashboard]]
- [[Domena - lekcje]]
- [[Domena - zadania]]
- [[Domena - grupy]]
- [[Security]]

Reguly:
- nauczyciel moze edytowac lekcje, jezeli jest jej wlascicielem
- admin moze wykonywac operacje wlascicielskie
- zadanie musi nalezec do lekcji wskazanej w URL

Zrodla:
- [LessonService.java](../../backend/src/main/java/pl/freeedu/backend/lesson/service/LessonService.java)
- [TaskService.java](../../backend/src/main/java/pl/freeedu/backend/task/service/TaskService.java)
