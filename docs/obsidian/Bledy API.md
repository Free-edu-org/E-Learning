# Bledy API

Bledy API sa mapowane przez globalny handler i kody domenowe.

Obszary:
- `GlobalErrorCode` -> bledy wspolne
- `AuthErrorCode` -> [[Przeplyw - logowanie i sesja]]
- `UserErrorCode` -> [[Domena - uzytkownicy]]
- `UserGroupErrorCode` -> [[Domena - grupy]]
- `LessonErrorCode` -> [[Domena - lekcje]]
- `TaskErrorCode` -> [[Domena - zadania]] i [[Domena - postep studenta]]

Polaczenia:
- [[API Client]] czyta Problem Details i rzuca `ApiError`
- `TOKEN_EXPIRED` wyzwala `auth:expired` po stronie frontendu

Zrodla:
- [GlobalExceptionHandler.java](../../backend/src/main/java/pl/freeedu/backend/exception/GlobalExceptionHandler.java)
- [ErrorCode.java](../../backend/src/main/java/pl/freeedu/backend/exception/ErrorCode.java)
