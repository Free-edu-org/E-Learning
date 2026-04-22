# Przeplyw - logowanie i sesja

```mermaid
sequenceDiagram
  participant U as Uzytkownik
  participant F as Frontend Login
  participant A as Auth API
  participant S as Security/JWT
  participant DB as users
  U->>F: email/username + password
  F->>A: POST /api/v1/auth/login
  A->>DB: szukaj uzytkownika
  A->>S: generuj JWT
  S-->>A: token
  A-->>F: AuthResponse
  F->>F: zapisz token i role
```

Wezly:
- [[Frontend - Login]]
- [[API Client]]
- [[Backend]]
- [[Security]]
- [[Domena - uzytkownicy]]

Zrodla:
- [AuthController.java](../../backend/src/main/java/pl/freeedu/backend/auth/controller/v1/AuthController.java)
- [AuthService.java](../../backend/src/main/java/pl/freeedu/backend/auth/service/AuthService.java)
- [Login.tsx](../../frontend/src/features/auth/Login.tsx)
