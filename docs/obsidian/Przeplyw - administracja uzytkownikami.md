# Przeplyw - administracja uzytkownikami

Ten przeplyw dotyczy tworzenia i aktualizacji kont przez [[Rola - Admin]] oraz czesci operacji nauczyciela na uczniach.

Polaczenia:
- [[Frontend - Admin Dashboard]]
- [[Frontend - Teacher Dashboard]]
- [[Admin Dashboard]]
- [[Teacher Dashboard]]
- [[Domena - uzytkownicy]]
- [[Domena - grupy]]
- [[Security]]

Scenariusze:
- admin tworzy nauczyciela
- admin tworzy ucznia
- nauczyciel tworzy ucznia w swoim zakresie
- nauczyciel przypisuje ucznia do grupy
- admin lub wlasciciel aktualizuje profil i haslo

Zrodla:
- [AdminService.java](../../backend/src/main/java/pl/freeedu/backend/admin/service/AdminService.java)
- [TeacherService.java](../../backend/src/main/java/pl/freeedu/backend/teacher/service/TeacherService.java)
- [UserService.java](../../backend/src/main/java/pl/freeedu/backend/user/service/UserService.java)
