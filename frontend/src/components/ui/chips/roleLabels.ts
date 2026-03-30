import type { ChipProps } from "@mui/material";

export type AppUserRole = "TEACHER" | "STUDENT";

export function getRoleLabel(role: AppUserRole) {
  return role === "TEACHER" ? "Nauczyciel" : "Uczeń";
}

export function getRoleAccountLabel(role: AppUserRole) {
  return role === "TEACHER" ? "Konto nauczyciela" : "Konto ucznia";
}

export function getRoleChipColor(role: AppUserRole): ChipProps["color"] {
  return role === "TEACHER" ? "info" : "success";
}

