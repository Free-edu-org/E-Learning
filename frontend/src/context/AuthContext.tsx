/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { Typography, Button, Container } from "@mui/material";
import { WarningOutlined } from "@mui/icons-material";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
  }, [role]);

  const login = (newToken: string, newRole: string) => {
    setToken(newToken);
    setRole(newRole);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
  };

  useEffect(() => {
    const handleExpired = () => {
      logout();
      setIsExpired(true);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  if (isExpired) {
    return (
      <AuthContext.Provider value={{ token, role, login, logout }}>
        <Container
          maxWidth="sm"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
          }}
        >
          <WarningOutlined
            sx={{ fontSize: 64, color: "warning.main", mb: 2 }}
          />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Twoja sesja wygasła
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Ze względów bezpieczeństwa wylogowaliśmy Cię. Zaloguj się ponownie,
            aby kontynuować.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setIsExpired(false)}
            sx={{ borderRadius: 2, px: 4, py: 1 }}
          >
            Wróć do logowania
          </Button>
        </Container>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
