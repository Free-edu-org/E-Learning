# Domena - uzytkownicy

Uzytkownicy sa wspolnym wezlem dla [[Security]], [[Domena - grupy]], [[Domena - lekcje]] i [[Domena - postep studenta]].

Role:
- [[Rola - Admin]]
- [[Rola - Teacher]]
- [[Rola - Student]]

Operacje:
- logowanie przez [[Przeplyw - logowanie i sesja]]
- pobranie profilu `GET /api/v1/users/me`
- admin tworzy adminow, nauczycieli i uczniow
- nauczyciel moze zarzadzac studentami w swoim zakresie
- uzytkownik moze aktualizowac swoje dane i haslo

Powiazania danych:
- `users.id` jest FK w `lessons.teacher_id`
- `users.id` jest FK w `user_in_group.user_id`
- `users.id` jest FK w `user_lessons.user_id`
- `users.id` jest FK w `user_answers.user_id`

Zrodla:
- [User.java](../../backend/src/main/java/pl/freeedu/backend/user/model/User.java)
- [UserController.java](../../backend/src/main/java/pl/freeedu/backend/user/controller/UserController.java)
- [UserService.java](../../backend/src/main/java/pl/freeedu/backend/user/service/UserService.java)
