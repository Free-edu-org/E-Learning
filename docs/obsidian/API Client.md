# API Client

[[Frontend]] wysyla zadania do [[Backend]] przez `fetchApi`. Klient dokleja token JWT z `localStorage`, ustawia `Content-Type: application/json` dla zwyklych requestow i obsluguje `FormData` dla transkrypcji audio.

Polaczenia:
- [[Przeplyw - logowanie i sesja]] zapisuje token po odpowiedzi z `/api/v1/auth/login`
- [[Frontend - Lesson Solver]] korzysta z [[Domena - zadania]] i [[Domena - postep studenta]]
- [[Przeplyw - rozpoznawanie mowy]] wysyla multipart do endpointu transkrypcji
- blad `TOKEN_EXPIRED` emituje zdarzenie `auth:expired`

Serwisy frontendowe:
- `authService.ts` -> [[Domena - uzytkownicy]]
- `adminService.ts` -> [[Admin Dashboard]]
- `lessonService.ts` -> [[Domena - lekcje]] i [[Teacher Dashboard]]
- `studentService.ts` -> [[Student Dashboard]] i [[Domena - postep studenta]]
- `taskService.ts` -> [[Domena - zadania]]
- `userGroupService.ts` -> [[Domena - grupy]]
- `userService.ts` -> [[Domena - uzytkownicy]]

Zrodla:
- [apiClient.ts](../../frontend/src/api/apiClient.ts)
- [authService.ts](../../frontend/src/api/authService.ts)
- [taskService.ts](../../frontend/src/api/taskService.ts)
