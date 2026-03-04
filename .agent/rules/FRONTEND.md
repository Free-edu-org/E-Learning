---
trigger: always_on
---

# Frontend Standards: FreeEdu

## Stack
- **Framework:** React 19 (Strict Mode)
- **Build Tool:** Vite
- **Styling:** Material UI (@mui/material) + Emotion
- **State Management:** React Context + Hooks (preferowane natywne rozwiązania)

## Coding Skills & Flow
- **Data Fetching:** Używaj hooka `use()` do obsługi Promise i Context (React 19).
- **Formularze:** Wykorzystuj `useActionState` oraz `useFormStatus` do obsługi interakcji.
- **Typowanie:** Każdy komponent musi mieć zdefiniowane `interface Props`. Zakaz używania `any`.
- **Struktura Feature:** Logika biznesowa (np. `matching-exercise`) musi być zamknięta w `/src/features/[feature-name]`.

## UI/UX Guidelines
- Wszystkie kolory i typografia muszą pochodzić z `MuiTheme`. Nie hardkoduj kolorów HEX.
- Komponenty muszą być responsywne (używaj `sx={{ display: { xs: 'none', md: 'block' } }}`).