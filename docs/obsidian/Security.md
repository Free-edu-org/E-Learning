# Security

Security laczy [[Backend]], [[Domena - uzytkownicy]], [[Domena - grupy]] i [[Domena - lekcje]].

Mechanizmy:
- JWT w filtrze `JwtAuthenticationFilter`
- role: [[Rola - Admin]], [[Rola - Teacher]], [[Rola - Student]]
- metoda-level security przez `@PreAuthorize`
- owner-checki w `SecurityService`
- CSRF wymagany poza ignorowanymi sciezkami API i Swaggera
- CORS dla lokalnych portow frontendu `5173` i `5174`
- publiczny odczyt plikow `GET /uploads/avatars/**`

Najwazniejsze checki:
- `isOwner` chroni operacje na wlasnym uzytkowniku
- `isTeacherOfStudent` sprawdza relacje nauczyciel -> uczen przez [[Domena - grupy]]
- `isGroupOwner` chroni grupe nauczyciela
- `isLessonOwner` chroni lekcje nauczyciela
- `hasStudentAccessToLesson` sprawdza dostep studenta przez przypisanie grupy do lekcji
- zmiana awatara jest chroniona przez `hasRole('ADMIN') or isOwner(authentication, #id)`

Awatary:
- upload i wybor presetu sa dostepne tylko dla admina albo wlasciciela konta.
- uploadowane pliki moga byc czytane publicznie jako statyczne zasoby, bo sa uzywane w UI bez dodatkowego requestu autoryzacyjnego.
- walidacje pliku sa opisane w [[Awatary uzytkownikow]].

Zrodla:
- [SecurityConfig.java](../../backend/src/main/java/pl/freeedu/backend/security/config/SecurityConfig.java)
- [SecurityService.java](../../backend/src/main/java/pl/freeedu/backend/security/service/SecurityService.java)
- [JwtService.java](../../backend/src/main/java/pl/freeedu/backend/security/jwt/JwtService.java)
