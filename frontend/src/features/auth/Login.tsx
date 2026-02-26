import type { FormEvent } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grow,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { authService } from "@/api/authService.ts";
import { ApiError } from "@/api/apiClient.ts";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode, toggleColorMode } = useAppTheme();
  const theme = useTheme();
  const cardBorderColor =
    mode === "dark"
      ? alpha(theme.palette.common.white, 0.15)
      : alpha(theme.palette.primary.main, 0.35);
  const cardHoverBorderColor =
    mode === "dark"
      ? alpha(theme.palette.primary.light, 0.35)
      : theme.palette.primary.main;
  const fieldBgColor =
    mode === "dark" ? alpha(theme.palette.common.white, 0.04) : "transparent";
  const fieldOutlineColor = alpha(theme.palette.text.secondary, 0.4);
  const fieldTextColor = theme.palette.text.primary;
  const dividerColor = alpha(theme.palette.text.secondary, 0.75);
  const textFieldSx = {
    backgroundColor: fieldBgColor,
    borderRadius: 2,
    "& .MuiOutlinedInput-root": {
      color: fieldTextColor,
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: cardHoverBorderColor,
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: cardHoverBorderColor,
      },
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: fieldOutlineColor,
    },
    "& .MuiInputLabel-root": {
      color: theme.palette.text.secondary,
    },
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.token, response.role);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.problem.code === "INVALID_CREDENTIALS") {
          setErrorMsg("Nieprawidłowy email lub hasło.");
        } else {
          setErrorMsg(err.problem.detail || "Wystąpił błąd logowania.");
        }
      } else if (err instanceof Error && err.message === "NETWORK_ERROR") {
        setErrorMsg("Brak połączenia z serwerem. Spróbuj ponownie później.");
      } else {
        setErrorMsg("Wystąpił nieoczekiwany błąd.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: theme.transitions.create("background-color", {
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          bgcolor:
            mode === "dark"
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.95),
          borderRadius: "999px",
          boxShadow: theme.shadows[4],
        }}
      >
        <IconButton
          onClick={toggleColorMode}
          color="inherit"
          sx={{
            p: 1.25,
          }}
        >
          {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>

      <Grow in timeout={500} style={{ transformOrigin: "top center" }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 450,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${cardBorderColor}`,
            boxShadow: theme.shadows[8],
            transition: theme.transitions.create(
              ["transform", "box-shadow", "border-color"],
              { duration: theme.transitions.duration.short },
            ),
            "&:hover": {
              transform: "translateY(-6px) scale(1.01)",
              boxShadow: theme.shadows[12],
              borderColor: cardHoverBorderColor,
            },
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box
              sx={{
                bgcolor: mode === "dark" ? "primary.dark" : "primary.light",
                color: mode === "dark" ? "white" : "primary.main",
                p: 1.5,
                borderRadius: "50%",
                mb: 2,
              }}
            >
              <BookIcon fontSize="large" />
            </Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              color={theme.palette.text.primary}
            >
              English Learning Platform
            </Typography>
            <Typography
              variant="body2"
              color={theme.palette.text.secondary}
            >
              Zaloguj się, aby kontynuować
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          <Divider
            sx={{
              mb: 3,
              fontSize: "0.8rem",
              color: dividerColor,
            }}
          >
            LUB UŻYJ FORMULARZA
          </Divider>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              variant="outlined"
              sx={textFieldSx}
            />
            <TextField
              label="Hasło"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              variant="outlined"
              sx={textFieldSx}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 1, position: "relative" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Zaloguj się"
              )}
            </Button>
          </form>
        </Paper>
      </Grow>
    </Box>
  );
}
