# Frontend

Frontend to React 19 + Vite + TypeScript + Material UI. Routing jest oparty o `react-router-dom`, a dostep do widokow kontroluje [[Protected Route]] oraz rola z [[Auth Context]].

Glowne widoki:
- [[Frontend - Login]]
- [[Frontend - Admin Dashboard]]
- [[Frontend - Teacher Dashboard]]
- [[Frontend - Student Dashboard]]
- [[Frontend - Lesson Solver]]

Integracje z backendem:
- [[API Client]]
- [[Mapa API]]
- [[Przeplyw - logowanie i sesja]]
- [[Przeplyw - nauczyciel tworzy lekcje]]
- [[Przeplyw - student rozwiazuje lekcje]]
- [[Awatary uzytkownikow]]

Wspolne elementy UI:
- `UserAvatar` renderuje preset `preset:avatar_X`, uploadowany plik albo inicjaly uzytkownika.
- `DashboardHeader` pokazuje awatar zalogowanego uzytkownika i otwiera ustawienia konta.
- `AccountSettingsDialog` obsluguje upload pliku awatara oraz wybor wbudowanego presetu.
- presety SVG sa w `frontend/public/avatars`.

Routing:
- `/login` -> [[Frontend - Login]]
- `/admin` -> [[Frontend - Admin Dashboard]]
- `/teacher` -> [[Frontend - Teacher Dashboard]]
- `/teacher/students` -> widok uczniow nauczyciela
- `/student` -> [[Frontend - Student Dashboard]]
- `/student/lessons/:lessonPublicId` -> [[Frontend - Lesson Solver]]

Najwazniejsze pliki:
- [App.tsx](../../frontend/src/App.tsx)
- [package.json](../../frontend/package.json)
- [apiClient.ts](../../frontend/src/api/apiClient.ts)
- [UserAvatar.tsx](../../frontend/src/components/ui/avatar/UserAvatar.tsx)
- [AccountSettingsDialog.tsx](../../frontend/src/components/ui/panel/AccountSettingsDialog.tsx)
