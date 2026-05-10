import type { FormEvent } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grow,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  MenuBook as BookIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  People as PeopleIcon,
  GroupWork as GroupIcon,
  AutoGraph as ChartIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { ThemeSwitcher } from "../../components/ui/ThemeSwitcher";
import { authService } from "@/api/authService.ts";
import { ApiError } from "@/api/apiClient.ts";
import { getApiErrorMessage } from "@/utils/dashboardUtils";

interface BlobProps {
  color: string;
  top?: string;
  left?: string;
  size?: number;
  delay?: string;
}

function Blob({ color, top, left, size, delay }: BlobProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        width: size || 400,
        height: size || 400,
        borderRadius: "50%",
        background: color,
        top: top || "10%",
        left: left || "10%",
        filter: "blur(100px)",
        opacity: 0.1,
        zIndex: 0,
        animation: `blob-float 20s ease-in-out infinite alternate`,
        animationDelay: delay || "0s",
        pointerEvents: "none",
        "@keyframes blob-float": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(60px, 40px) scale(1.1)" },
        },
      }}
    />
  );
}

interface FeatureRowProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

function FeatureRow({ icon: Icon, title, subtitle }: FeatureRowProps) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box>
        <Typography
          variant="body2"
          fontWeight="600"
          sx={{ lineHeight: 1.2, mb: 0.2 }}
        >
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

function DashboardPreview() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        mt: "auto",
        pt: 4,
        position: "relative",
        opacity: 0.8,
        width: "100%",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          background: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(15px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: "hidden",
          boxShadow: isDark
            ? "0 20px 40px rgba(0,0,0,0.3)"
            : "0 15px 30px rgba(0,0,0,0.04)",
        }}
      >
        <Stack spacing={2}>
          {/* Header Bar */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              }}
            />
            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.divider, 0.1),
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.divider, 0.1),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Mock Sidebar */}
            <Stack
              spacing={1}
              sx={{
                borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                pr: 1.5,
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "4px",
                    bgcolor:
                      i === 1
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.divider, 0.05),
                  }}
                />
              ))}
            </Stack>

            {/* Content Area */}
            <Stack flex={1} spacing={2}>
              {/* Cards Row */}
              <Stack direction="row" spacing={1.5}>
                <Box
                  sx={{
                    flex: 1,
                    height: 40,
                    borderRadius: 2,
                    background: alpha(theme.palette.primary.main, 0.03),
                    border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    height: 40,
                    borderRadius: 2,
                    background: alpha(theme.palette.divider, 0.02),
                    border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    height: 40,
                    borderRadius: 2,
                    background: alpha(theme.palette.divider, 0.02),
                    border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  }}
                />
              </Stack>

              {/* Main Visuals Row */}
              <Stack direction="row" spacing={2} sx={{ height: 80 }}>
                {/* Pie Chart Mock */}
                <Box
                  sx={{
                    width: 80,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      border: `10px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: -10,
                        left: -10,
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        border: `10px solid ${theme.palette.primary.main}`,
                        borderBottomColor: "transparent",
                        borderRightColor: "transparent",
                        transform: "rotate(45deg)",
                      }}
                    />
                  </Box>
                </Box>

                {/* Bar Chart Mock */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 0.75,
                    height: "100%",
                  }}
                >
                  {[30, 60, 45, 80, 55, 70].map((h, i) => (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: `${h}%`,
                        borderRadius: "2px 2px 0 0",
                        bgcolor:
                          i === 3
                            ? theme.palette.primary.main
                            : alpha(theme.palette.primary.main, 0.1),
                      }}
                    />
                  ))}
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

// --- Main Component ---

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode } = useAppTheme();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await authService.login({ identifier, password });
      login(response.token, response.role);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(getApiErrorMessage(err, "Wystąpił błąd logowania."));
      } else if (err instanceof Error && err.message === "NETWORK_ERROR") {
        setErrorMsg("Brak połączenia z serwerem. Spróbuj ponownie później.");
      } else {
        setErrorMsg("Wystąpił nieoczekiwany błąd.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflow: "hidden",
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Background Decor */}
      <Blob
        color={theme.palette.primary.main}
        top="-5%"
        left="-5%"
        size={500}
      />
      <Blob
        color={theme.palette.secondary.main}
        top="60%"
        left="80%"
        size={600}
        delay="2s"
      />
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.dark, 0.15)} 0%, transparent 40%),
               radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.dark, 0.1)} 0%, transparent 40%)`
            : `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 40%),
               radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.light, 0.05)} 0%, transparent 40%)`,
          pointerEvents: "none",
        }}
      />

      {/* Theme Switcher Overlay */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: { xs: 16, md: 32 },
          zIndex: 1000,
        }}
      >
        <ThemeSwitcher />
      </Box>

      <Grow in timeout={800}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1200,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            borderRadius: { xs: 3, md: 4 },
            overflow: "hidden",
            boxShadow: isDark
              ? `0 32px 100px ${alpha(theme.palette.common.black, 0.7)}`
              : `0 24px 80px ${alpha(theme.palette.primary.main, 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: theme.palette.background.paper,
            position: "relative",
            zIndex: 1,
            minHeight: { md: 580 },
          }}
        >
          {/* LEFT: Branding Section */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 4, md: 5 },
              display: "flex",
              flexDirection: "column",
              bgcolor: isDark
                ? alpha(theme.palette.primary.main, 0.015)
                : alpha(theme.palette.primary.main, 0.01),
              borderRight: {
                md: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ mb: { xs: 3, md: 5 } }}
            >
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  p: 0.85,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <BookIcon fontSize="small" />
              </Box>
              <Typography
                variant="body1"
                fontWeight="800"
                sx={{ letterSpacing: "-0.5px" }}
              >
                FreeEdu
              </Typography>
            </Stack>

            <Typography
              variant="h5"
              fontWeight="800"
              sx={{
                mb: 2,
                lineHeight: 1.2,
                fontSize: { xs: "1.6rem", md: "2.3rem" },
                maxWidth: 420,
                background: isDark
                  ? `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.common.white, 0.7)} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Zarządzaj edukacją w jednym miejscu
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 4, fontWeight: 400, maxWidth: 400, lineHeight: 1.5 }}
            >
              FreeEdu to nowoczesna platforma do zarządzania szkołą, uczniami,
              nauczycielami i grupami.
            </Typography>

            <Stack spacing={1}>
              <FeatureRow
                icon={PeopleIcon}
                title="Zarządzaj uczniami i nauczycielami"
                subtitle="Pełna kontrola nad bazą użytkowników i uprawnieniami."
              />
              <FeatureRow
                icon={GroupIcon}
                title="Twórz grupy i klasy"
                subtitle="Elastyczne zarządzanie strukturą organizacyjną szkoły."
              />
              <FeatureRow
                icon={ChartIcon}
                title="Monitoruj postępy"
                subtitle="Śledź wyniki i osiągnięcia w czasie rzeczywistym."
              />
            </Stack>

            {isMdUp && <DashboardPreview />}
          </Box>

          {/* RIGHT: Login Section */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 4, md: 6 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ textAlign: "center", mb: 3.5 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: 1.25,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                  mb: 2,
                }}
              >
                <LockIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography
                variant="h6"
                fontWeight="800"
                gutterBottom
                sx={{ letterSpacing: "-0.5px" }}
              >
                Witaj ponownie!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Zaloguj się, aby kontynuować pracę
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Login lub Email"
                  name="username"
                  autoComplete="username"
                  fullWidth
                  variant="outlined"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="jan.kowalski@szkola.pl"
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" sx={{ fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.01),
                      },
                      "&.Mui-focused": {
                        bgcolor: alpha(theme.palette.primary.main, 0.01),
                      },
                    },
                  }}
                />
                <Box>
                  <TextField
                    label="Hasło"
                    name="password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOff sx={{ fontSize: 20 }} />
                            ) : (
                              <Visibility sx={{ fontSize: 20 }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.01),
                        },
                        "&.Mui-focused": {
                          bgcolor: alpha(theme.palette.primary.main, 0.01),
                        },
                      },
                    }}
                  />
                  <Box sx={{ textAlign: "right", mt: 1.5 }}>
                    <Typography
                      component={RouterLink}
                      to="/forgot-password"
                      variant="body2"
                      fontWeight="600"
                      color="primary"
                      sx={{
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Nie pamiętasz hasła?
                    </Typography>
                  </Box>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    textTransform: "none",
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      boxShadow: `0 10px 28px ${alpha(theme.palette.primary.main, 0.3)}`,
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Zaloguj się"
                  )}
                </Button>
              </Stack>
            </form>
          </Box>
        </Box>
      </Grow>

      {/* Footer / Bottom Info */}
      <Box sx={{ mt: 3, textAlign: "center", position: "relative", zIndex: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
          sx={{ opacity: 0.6 }}
        >
          <ShieldIcon sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="caption" color="text.secondary">
            Konta użytkowników tworzone są przez administratora szkoły.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
