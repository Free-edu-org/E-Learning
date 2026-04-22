# Protected Route

Protected Route pilnuje dostepu do ekranow we [[Frontend]].

Polaczenia:
- czyta role z [[Auth Context]]
- chroni [[Frontend - Admin Dashboard]] dla [[Rola - Admin]]
- chroni [[Frontend - Teacher Dashboard]] dla [[Rola - Teacher]]
- chroni [[Frontend - Student Dashboard]] i [[Frontend - Lesson Solver]] dla [[Rola - Student]]

Zrodla:
- [ProtectedRoute.tsx](../../frontend/src/components/ProtectedRoute.tsx)
- [App.tsx](../../frontend/src/App.tsx)
