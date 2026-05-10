/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export type ThemeMode = "light" | "dark";

export interface ThemeContextType {
  mode: ThemeMode;
  toggleColorMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleColorMode: () => {},
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

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
      mode,
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#6366f1",
            light: "#818cf8",
            dark: "#4f46e5",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#8b5cf6",
            light: "#a78bfa",
            dark: "#7c3aed",
          },
          success: {
            main: "#10b981",
            light: "#34d399",
            dark: "#059669",
          },
          error: {
            main: "#ef4444",
            light: "#f87171",
            dark: "#dc2626",
          },
          warning: {
            main: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706",
          },
          info: {
            main: "#3b82f6",
            light: "#60a5fa",
            dark: "#2563eb",
          },
          background: {
            default: mode === "light" ? "#f5f7fb" : "#0b0d12",
            paper: mode === "light" ? "#ffffff" : "#151822",
          },
          text: {
            primary: mode === "light" ? "#0f172a" : "#f8fafc",
            secondary: mode === "light" ? "#64748b" : "#a7b0c0",
          },
          divider:
            mode === "light"
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
                scrollbarWidth: "thin",
                scrollbarColor:
                  mode === "light"
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
                  backgroundColor: mode === "light" ? "#ffffff" : "#1b2030",
                  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  "& fieldset": {
                    borderColor:
                      mode === "light"
                        ? "rgba(15, 23, 42, 0.14)"
                        : "rgba(139, 92, 246, 0.18)",
                    transition: "border-color 0.2s ease",
                  },
                  "&:hover fieldset": {
                    borderColor:
                      mode === "light"
                        ? "rgba(15, 23, 42, 0.28)"
                        : "rgba(139, 92, 246, 0.35)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#7c6cff",
                    borderWidth: "1.5px",
                  },
                  "&.Mui-focused": {
                    boxShadow:
                      mode === "light"
                        ? "0 0 0 3px rgba(99, 102, 241, 0.12)"
                        : "0 0 0 3px rgba(124, 108, 255, 0.18)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor:
                      mode === "light"
                        ? "rgba(15, 23, 42, 0.03)"
                        : "rgba(255, 255, 255, 0.02)",
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#6366f1",
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
    [mode],
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
