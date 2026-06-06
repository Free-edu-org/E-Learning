/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export type ThemeMode = "light" | "dark";

const FONT_SCALE_STEP = 12.5;
const MIN_FONT_SCALE = 87.5;
const DEFAULT_FONT_SCALE = 100;
const MAX_FONT_SCALE = 125;

export interface ThemeContextType {
  mode: ThemeMode;
  highContrast: boolean;
  fontScale: number;
  toggleColorMode: () => void;
  toggleHighContrast: () => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetAccessibility: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  highContrast: false,
  fontScale: DEFAULT_FONT_SCALE,
  toggleColorMode: () => {},
  toggleHighContrast: () => {},
  increaseFontScale: () => {},
  decreaseFontScale: () => {},
  resetAccessibility: () => {},
});

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
};

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem("themeMode") as ThemeMode;
    return savedMode || "light";
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("highContrast") === "true";
  });
  const [fontScale, setFontScale] = useState(() => {
    const savedScale = Number(localStorage.getItem("fontScale"));
    if (!Number.isFinite(savedScale)) {
      return DEFAULT_FONT_SCALE;
    }
    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, savedScale));
  });

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("highContrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem("fontScale", String(fontScale));
    document.documentElement.style.fontSize = `${fontScale}%`;
  }, [fontScale]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
      toggleHighContrast: () => {
        setHighContrast((current) => !current);
      },
      increaseFontScale: () => {
        setFontScale((current) =>
          Math.min(MAX_FONT_SCALE, current + FONT_SCALE_STEP),
        );
      },
      decreaseFontScale: () => {
        setFontScale((current) =>
          Math.max(MIN_FONT_SCALE, current - FONT_SCALE_STEP),
        );
      },
      resetAccessibility: () => {
        setHighContrast(false);
        setFontScale(DEFAULT_FONT_SCALE);
      },
      mode,
      highContrast,
      fontScale,
    }),
    [fontScale, highContrast, mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: highContrast ? "dark" : mode,
          primary: {
            main: highContrast ? "#facc15" : "#6366f1",
            light: highContrast ? "#fde047" : "#818cf8",
            dark: highContrast ? "#eab308" : "#4f46e5",
            contrastText: highContrast ? "#000000" : "#ffffff",
          },
          secondary: {
            main: highContrast ? "#22d3ee" : "#8b5cf6",
            light: highContrast ? "#67e8f9" : "#a78bfa",
            dark: highContrast ? "#06b6d4" : "#7c3aed",
          },
          success: {
            main: highContrast ? "#22c55e" : "#10b981",
            light: highContrast ? "#4ade80" : "#34d399",
            dark: highContrast ? "#16a34a" : "#059669",
          },
          error: {
            main: highContrast ? "#f87171" : "#ef4444",
            light: highContrast ? "#fca5a5" : "#f87171",
            dark: highContrast ? "#ef4444" : "#dc2626",
          },
          warning: {
            main: highContrast ? "#facc15" : "#f59e0b",
            light: highContrast ? "#fde047" : "#fbbf24",
            dark: highContrast ? "#eab308" : "#d97706",
          },
          info: {
            main: highContrast ? "#38bdf8" : "#3b82f6",
            light: highContrast ? "#7dd3fc" : "#60a5fa",
            dark: highContrast ? "#0ea5e9" : "#2563eb",
          },
          background: {
            default: highContrast
              ? "#000000"
              : mode === "light"
                ? "#f5f7fb"
                : "#0b0d12",
            paper: highContrast
              ? "#050505"
              : mode === "light"
                ? "#ffffff"
                : "#151822",
          },
          text: {
            primary: highContrast
              ? "#ffffff"
              : mode === "light"
                ? "#0f172a"
                : "#f8fafc",
            secondary: highContrast
              ? "#facc15"
              : mode === "light"
                ? "#64748b"
                : "#a7b0c0",
          },
          divider:
            highContrast
              ? "rgba(255, 255, 255, 0.58)"
              : mode === "light"
              ? "rgba(15, 23, 42, 0.08)"
              : "rgba(139, 92, 246, 0.12)",
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 700, letterSpacing: "-0.025em" },
          h2: { fontWeight: 700, letterSpacing: "-0.02em" },
          h3: { fontWeight: 700, letterSpacing: "-0.015em" },
          h4: { fontWeight: 700, letterSpacing: "-0.01em" },
          h5: { fontWeight: 700, letterSpacing: "-0.01em" },
          h6: { fontWeight: 700 },
          subtitle1: { fontWeight: 600 },
          subtitle2: { fontWeight: 600 },
          body1: { lineHeight: 1.65 },
          body2: { lineHeight: 1.6 },
          caption: { lineHeight: 1.5 },
          button: { fontWeight: 600, textTransform: "none" },
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: highContrast
                  ? "#000000"
                  : mode === "light"
                    ? "#f5f7fb"
                    : "#0b0d12",
                scrollbarWidth: "thin",
                scrollbarColor:
                  highContrast
                    ? "#facc15 #000000"
                    : mode === "light"
                    ? "rgba(15,23,42,0.15) transparent"
                    : "rgba(255,255,255,0.1) transparent",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: "10px",
                fontWeight: 600,
                letterSpacing: 0,
                transition:
                  "transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
                "&:active": {
                  transform: "scale(0.98)",
                },
              },
              sizeSmall: {
                padding: "5px 12px",
                fontSize: "0.8125rem",
                borderRadius: "8px",
              },
              sizeMedium: {
                padding: "8px 18px",
              },
              sizeLarge: {
                padding: "11px 24px",
                fontSize: "1rem",
              },
              contained: {
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.32)",
                  transform: "translateY(-1px)",
                },
              },
              outlined: {
                borderColor:
                  mode === "light"
                    ? "rgba(15, 23, 42, 0.14)"
                    : "rgba(139, 92, 246, 0.2)",
                "&:hover": {
                  borderColor:
                    mode === "light"
                      ? "rgba(15, 23, 42, 0.26)"
                      : "rgba(139, 92, 246, 0.38)",
                  backgroundColor:
                    mode === "light"
                      ? "rgba(15, 23, 42, 0.04)"
                      : "rgba(139, 92, 246, 0.06)",
                },
              },
              text: {
                "&:hover": {
                  backgroundColor:
                    mode === "light"
                      ? "rgba(15, 23, 42, 0.05)"
                      : "rgba(139, 92, 246, 0.08)",
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: highContrast
                    ? "#000000"
                    : mode === "light"
                      ? "#ffffff"
                      : "#1b2030",
                  color: highContrast ? "#ffffff" : undefined,
                  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  "& fieldset": {
                    borderColor:
                      highContrast
                        ? "#facc15"
                        : mode === "light"
                        ? "rgba(15, 23, 42, 0.14)"
                        : "rgba(139, 92, 246, 0.18)",
                    transition: "border-color 0.2s ease",
                  },
                  "&:hover fieldset": {
                    borderColor:
                      highContrast
                        ? "#fde047"
                        : mode === "light"
                        ? "rgba(15, 23, 42, 0.28)"
                        : "rgba(139, 92, 246, 0.35)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: highContrast ? "#ffffff" : "#7c6cff",
                    borderWidth: "1.5px",
                  },
                  "&.Mui-focused": {
                    boxShadow:
                      highContrast
                        ? "0 0 0 3px rgba(250, 204, 21, 0.45)"
                        : mode === "light"
                        ? "0 0 0 3px rgba(99, 102, 241, 0.12)"
                        : "0 0 0 3px rgba(124, 108, 255, 0.18)",
                  },
                  "& .MuiInputBase-input": {
                    color: highContrast ? "#ffffff" : undefined,
                    "&::placeholder": {
                      color: highContrast ? "#facc15" : undefined,
                      opacity: highContrast ? 1 : undefined,
                    },
                  },
                  "&.Mui-disabled": {
                    backgroundColor:
                      highContrast
                        ? "#111111"
                        : mode === "light"
                        ? "rgba(15, 23, 42, 0.03)"
                        : "rgba(255, 255, 255, 0.02)",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: highContrast ? "#facc15" : undefined,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: highContrast ? "#ffffff" : "#6366f1",
                },
                "& .MuiFormHelperText-root": {
                  color: highContrast ? "#facc15" : undefined,
                },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              root: {
                borderRadius: "10px",
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                borderRadius: "6px",
                margin: "1px 4px",
                fontSize: "0.875rem",
                "&:hover": {
                  backgroundColor:
                    mode === "light"
                      ? "rgba(99, 102, 241, 0.06)"
                      : "rgba(99, 102, 241, 0.1)",
                },
                "&.Mui-selected": {
                  backgroundColor:
                    mode === "light"
                      ? "rgba(99, 102, 241, 0.1)"
                      : "rgba(99, 102, 241, 0.18)",
                  "&:hover": {
                    backgroundColor:
                      mode === "light"
                        ? "rgba(99, 102, 241, 0.14)"
                        : "rgba(99, 102, 241, 0.22)",
                  },
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
              elevation1: {
                boxShadow:
                  mode === "light"
                    ? "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)"
                    : "0 1px 3px rgba(0, 0, 0, 0.3)",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: "16px",
                border:
                  mode === "light"
                    ? "1px solid rgba(15, 23, 42, 0.08)"
                    : "1px solid rgba(139, 92, 246, 0.12)",
                boxShadow:
                  mode === "light"
                    ? "0 1px 4px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)"
                    : "0 1px 4px rgba(0, 0, 0, 0.4), 0 4px 24px rgba(0, 0, 0, 0.25)",
                backgroundColor: mode === "light" ? undefined : "#151822",
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: "999px",
                fontWeight: 500,
                fontSize: "0.78rem",
              },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              root: {
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#6366f1",
                },
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: "10px",
                border: "1px solid",
                fontSize: "0.875rem",
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: 500,
                backgroundColor:
                  mode === "light"
                    ? "rgba(15, 23, 42, 0.88)"
                    : "rgba(250, 250, 250, 0.92)",
                color: mode === "light" ? "#ffffff" : "#0f172a",
                boxShadow:
                  mode === "light"
                    ? "0 4px 12px rgba(15, 23, 42, 0.2)"
                    : "0 4px 12px rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(8px)",
              },
              arrow: {
                color:
                  mode === "light"
                    ? "rgba(15, 23, 42, 0.88)"
                    : "rgba(250, 250, 250, 0.92)",
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor:
                  mode === "light"
                    ? "rgba(15, 23, 42, 0.07)"
                    : "rgba(139, 92, 246, 0.1)",
              },
            },
          },
          MuiSkeleton: {
            styleOverrides: {
              root: {
                borderRadius: "8px",
                backgroundColor:
                  mode === "light"
                    ? "rgba(15, 23, 42, 0.07)"
                    : "rgba(139, 92, 246, 0.08)",
              },
            },
          },
        },
      }),
    [highContrast, mode],
  );

  return (
    <ThemeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
