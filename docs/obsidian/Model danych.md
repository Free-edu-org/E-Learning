# Model danych

Model danych jest utrzymywany przez Flyway i uzywany przez [[Backend]].

```mermaid
erDiagram
  users ||--o{ lessons : teaches
  users ||--o{ user_in_group : belongs
  user_groups ||--o{ user_in_group : has
  user_groups ||--o{ group_has_lesson : gets
  lessons ||--o{ group_has_lesson : assigned
  lessons ||--o{ choose_tasks : has
  lessons ||--o{ write_tasks : has
  lessons ||--o{ scatter_tasks : has
  lessons ||--o{ speak_tasks : has
  users ||--o{ user_lessons : progresses
  lessons ||--o{ user_lessons : tracked
  users ||--o{ user_answers : submits
  lessons ||--o{ user_answers : contains
  achievements ||--o{ user_get_achievement : awards
  users ||--o{ user_get_achievement : earns
```

Tabele domenowe:
- `users` -> [[Domena - uzytkownicy]]
- `user_groups`, `user_in_group`, `group_has_lesson` -> [[Domena - grupy]]
- `lessons` -> [[Domena - lekcje]]
- `choose_tasks`, `write_tasks`, `scatter_tasks`, `speak_tasks` -> [[Domena - zadania]]
- `user_lessons`, `user_answers` -> [[Domena - postep studenta]]
- `achievements`, `user_get_achievement` -> przyszly obszar osiagniec

Wazne ograniczenia:
- `user_in_group` ma `UNIQUE (user_id)`, czyli uczen nalezy do jednej grupy.
- `user_lessons` ma `UNIQUE (user_id, lesson_id)`, czyli jeden stan postepu na pare uczen-lekcja.
- zadania maja wspolne pola `hint` i `section`.
- `users.avatar_url` przechowuje preset awatara albo sciezke do pliku uploadowanego przez backend -> [[Awatary uzytkownikow]]

Zrodla:
- [migrations](../../backend/src/main/resources/db/migration)
- [seed](../../backend/src/main/resources/db/seed/V2_1__seed_tables.sql)
