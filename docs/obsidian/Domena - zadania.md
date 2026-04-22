# Domena - zadania

Zadania sa przypisane do [[Domena - lekcje]]. Projekt ma cztery typy zadan:
- choose
- write
- scatter
- speak

Polaczenia:
- [[Frontend - Teacher Dashboard]] tworzy i edytuje zadania przez `taskService`
- [[Frontend - Lesson Solver]] pobiera zadania i buduje odpowiedzi
- [[Przeplyw - rozpoznawanie mowy]] dotyczy typu `speak`
- [[Domena - postep studenta]] zapisuje wynik w `user_answers` i `user_lessons`

Wazne zachowania:
- dla studenta odpowiedzi poprawne sa ukrywane dla `choose`, `write` i `scatter`
- `speak` uzywa `expectedText` i podobienstwa tekstu
- zadania moga byc grupowane przez `section`
- kazde zadanie moze miec `hint`

Zrodla:
- [TaskController.java](../../backend/src/main/java/pl/freeedu/backend/task/controller/v1/TaskController.java)
- [TaskService.java](../../backend/src/main/java/pl/freeedu/backend/task/service/TaskService.java)
- [taskService.ts](../../frontend/src/api/taskService.ts)
