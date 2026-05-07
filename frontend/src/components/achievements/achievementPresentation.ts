import { alpha, type Theme } from "@mui/material/styles";

export type AchievementPaletteColor =
  | "warning"
  | "success"
  | "info"
  | "primary"
  | "secondary"
  | "error";

const COLOR_MAP: Record<string, AchievementPaletteColor> = {
  warning: "warning",
  success: "success",
  info: "info",
  primary: "primary",
  secondary: "secondary",
  error: "error",
};

export function resolveAchievementColor(
  color?: string,
): AchievementPaletteColor {
  const normalized = color?.trim().toLowerCase() ?? "";
  return COLOR_MAP[normalized] ?? "primary";
}

export function getAchievementTitle(title?: string): string {
  const normalized = title?.trim();
  return normalized ? normalized : "Osiągnięcie";
}

export function getAchievementDescription(description?: string): string {
  const normalized = description?.trim();
  return normalized
    ? normalized
    : "Szczegóły tego osiągnięcia pojawią się, gdy backend uzupełni opis.";
}

export function getAchievementIcon(icon?: string): string {
  const normalized = icon?.trim();
  return normalized ? normalized : "🏅";
}

export function getAchievementVisuals(theme: Theme, color?: string) {
  const paletteColor = resolveAchievementColor(color);
  const accent = theme.palette[paletteColor].main;

  return {
    paletteColor,
    accent,
    softBackground: alpha(accent, theme.palette.mode === "dark" ? 0.2 : 0.1),
    strongBackground: alpha(
      accent,
      theme.palette.mode === "dark" ? 0.28 : 0.16,
    ),
    border: alpha(accent, theme.palette.mode === "dark" ? 0.4 : 0.24),
    subduedBorder: alpha(
      theme.palette.divider,
      theme.palette.mode === "dark" ? 0.32 : 0.42,
    ),
  };
}
