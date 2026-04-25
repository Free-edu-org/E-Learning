# Mapa API

Mapa API spina [[Frontend]], [[API Client]] i kontrolery w [[Backend]].

Szczegoly kontraktu, DTO, statusow bledow i zasad aktualizacji sa w [[Kontrakt API]]. Reguly dostepu sa zebrane w [[Macierz rol i uprawnien]].

## Auth
- `POST /api/v1/auth/login` -> [[Przeplyw - logowanie i sesja]]

## Users
- `POST /api/v1/users/admin` -> [[Rola - Admin]]
- `POST /api/v1/users/teacher` -> [[Rola - Admin]]
- `POST /api/v1/users/register` -> [[Rola - Admin]]
- `GET /api/v1/users/me` -> [[Auth Context]]
- `GET /api/v1/users/{id}` -> [[Domena - uzytkownicy]]
- `PUT /api/v1/users/{id}` -> [[Domena - uzytkownicy]]
- `PUT /api/v1/users/{id}/password` -> [[Domena - uzytkownicy]]
- `POST /api/v1/users/{id}/avatar` -> [[Awatary uzytkownikow]]
- `PUT /api/v1/users/{id}/avatar/preset` -> [[Awatary uzytkownikow]]
- `DELETE /api/v1/users/{id}` -> [[Domena - uzytkownicy]]

## Static uploads
- `GET /uploads/avatars/**` -> [[Awatary uzytkownikow]]

## Admin
- `GET /api/v1/admin/stats` -> [[Admin Dashboard]]
- `GET /api/v1/admin/teachers` -> [[Admin Dashboard]]
- `GET /api/v1/admin/students` -> [[Admin Dashboard]]
- `POST /api/v1/admin/students` -> [[Przeplyw - administracja uzytkownikami]]
- `PUT /api/v1/admin/students/{id}` -> [[Przeplyw - administracja uzytkownikami]]

## Teacher
- `GET /api/v1/teacher/stats` -> [[Teacher Dashboard]]
- `GET /api/v1/teacher/lessons` -> [[Teacher Dashboard]]
- `GET /api/v1/teacher/lessons/{lessonId}/stats` -> [[Frontend - Wyniki Lekcji]]
- `GET /api/v1/teacher/my-groups` -> [[Domena - grupy]]
- `GET /api/v1/teacher/students` -> [[Teacher Dashboard]]
- `POST /api/v1/teacher/students` -> [[Przeplyw - administracja uzytkownikami]]
- `PUT /api/v1/teacher/students/{id}` -> [[Przeplyw - administracja uzytkownikami]]

## Lessons
- `GET /api/v1/lessons` -> [[Domena - lekcje]]
- `POST /api/v1/lessons` -> [[Przeplyw - nauczyciel tworzy lekcje]]
- `PUT /api/v1/lessons/{id}` -> [[Przeplyw - nauczyciel tworzy lekcje]]
- `PATCH /api/v1/lessons/{id}/status` -> [[Domena - lekcje]]
- `DELETE /api/v1/lessons/{id}` -> [[Domena - lekcje]]

## Tasks
- `GET /api/v1/lessons/{lessonId}/tasks` -> [[Domena - zadania]]
- `POST|PUT|DELETE /api/v1/lessons/{lessonId}/tasks/{type}` -> [[Przeplyw - nauczyciel tworzy lekcje]]
- `POST /api/v1/lessons/{lessonId}/tasks/speak/{taskId}/transcribe` -> [[Przeplyw - rozpoznawanie mowy]]
- `POST /api/v1/lessons/{lessonId}/submit` -> [[Przeplyw - student rozwiazuje lekcje]]
- `POST /api/v1/lessons/{lessonId}/users/{userId}/reset` -> [[Domena - postep studenta]]

## User groups
- `POST /api/v1/user-groups` -> [[Domena - grupy]]
- `GET /api/v1/user-groups` -> [[Domena - grupy]]
- `GET /api/v1/user-groups/{id}` -> [[Domena - grupy]]
- `PUT /api/v1/user-groups/{id}` -> [[Domena - grupy]]
- `DELETE /api/v1/user-groups/{id}` -> [[Domena - grupy]]
- `POST /api/v1/user-groups/{id}/members/{userId}` -> [[Domena - grupy]]
- `DELETE /api/v1/user-groups/{id}/members/{userId}` -> [[Domena - grupy]]

Zrodla:
- [api-contract.md](../../api-contract.md)
- [backend/http](../../backend/http)
