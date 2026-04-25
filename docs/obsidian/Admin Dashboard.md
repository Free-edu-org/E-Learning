# Admin Dashboard

Backendowy admin dashboard dostarcza statystyki, liste nauczycieli i liste studentow dla [[Frontend - Admin Dashboard]].

Listy uzytkownikow przenosza tez `avatarUrl`, dzieki czemu frontend moze pokazac awatary nauczycieli i uczniow w panelu admina. Szczegoly mechanizmu sa w [[Awatary uzytkownikow]].

Polaczenia:
- [[Rola - Admin]]
- [[Domena - uzytkownicy]]
- [[Awatary uzytkownikow]]
- [[Mapa API]]
- [[Przeplyw - administracja uzytkownikami]]

Zrodla:
- [AdminDashboardController.java](../../backend/src/main/java/pl/freeedu/backend/admin/controller/v1/AdminDashboardController.java)
- [AdminService.java](../../backend/src/main/java/pl/freeedu/backend/admin/service/AdminService.java)
- [adminService.ts](../../frontend/src/api/adminService.ts)
