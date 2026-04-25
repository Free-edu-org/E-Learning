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
- admin albo wlasciciel konta moze zmienic awatar przez upload pliku albo wybor presetu -> [[Awatary uzytkownikow]]

Powiazania danych:
- `users.id` jest FK w `lessons.teacher_id`
- `users.id` jest FK w `user_in_group.user_id`
- `users.id` jest FK w `user_lessons.user_id`
- `users.id` jest FK w `user_answers.user_id`
- `users.avatar_url` przechowuje preset albo sciezke do uploadowanego awatara

Awatary:
- `avatarUrl` trafia do `UserResponse` oraz DTO dashboardow, gdzie UI pokazuje nauczyciela albo ucznia.
- uploadowane pliki sa zapisywane w `uploads/avatars`.
- presety maja format `preset:avatar_X` i sa renderowane przez frontend z `frontend/public/avatars`.

Zrodla:
- [User.java](../../backend/src/main/java/pl/freeedu/backend/user/model/User.java)
- [UserController.java](../../backend/src/main/java/pl/freeedu/backend/user/controller/UserController.java)
- [UserService.java](../../backend/src/main/java/pl/freeedu/backend/user/service/UserService.java)
- [UserAvatar.tsx](../../frontend/src/components/ui/avatar/UserAvatar.tsx)
