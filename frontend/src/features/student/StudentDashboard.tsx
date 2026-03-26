import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Switch,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LogoutOutlined as LogoutIcon,
  SchoolOutlined as SchoolIcon,
  MenuBook as BookIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import { useAppTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/api/userService";
import { lessonService } from "@/api/lessonService";
import type { UserProfile } from "@/api/userService";
import type { StudentLesson } from "@/api/lessonService";
import { ApiError } from "@/api/apiClient";

export function StudentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { toggleColorMode } = useAppTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    lessonService
      .getStudentLessons()
      .then(setLessons)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.problem.detail || "Nie udało się pobrać lekcji.");
        } else {
          setError("Błąd połączenia z serwerem.");
        }
      })
      .finally(() => setLoadingLessons(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="lg" sx={{ pt: 4, position: "relative" }}>
        {/* Top bar */}
        <Box
          sx={{
            position: { xs: "relative", md: "absolute" },
            top: { md: 32 },
            right: { md: 24 },
            mb: { xs: 3, md: 0 },
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LightModeIcon
              fontSize="small"
              sx={{
                color:
                  theme.palette.mode === "light"
                    ? "primary.main"
                    : "text.disabled",
                mr: 0.5,
              }}
            />
            <Switch
              size="small"
              checked={theme.palette.mode === "dark"}
              onChange={toggleColorMode}
            />
            <DarkModeIcon
              fontSize="small"
              sx={{
                color:
                  theme.palette.mode === "dark"
                    ? "primary.main"
                    : "text.disabled",
                ml: 0.5,
              }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "background.paper",
            }}
          >
            Wyloguj
          </Button>
        </Box>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "background.paper",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 1,
            }}
          >
            <SchoolIcon sx={{ color: "primary.main" }} />
          </Box>
          <Box>
            {loadingUser ? (
              <Skeleton width={180} height={28} />
            ) : (
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Witaj, {user?.username ?? "Uczeń"}!
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Panel ucznia
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="primary.main"
          sx={{ mb: 2 }}
        >
          Twoje lekcje
        </Typography>

        {loadingLessons ? (
          <Grid container spacing={2}>
            {[...Array(6)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton
                  variant="rounded"
                  height={180}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : lessons.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nie masz jeszcze przypisanych lekcji. Poczekaj aż nauczyciel
            przydzieli Ci materiały.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {lessons.map((lesson) => (
              <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    transition: "box-shadow 0.2s, transform 0.15s",
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <BookIcon
                        sx={{
                          color: "primary.main",
                          fontSize: 18,
                          mt: 0.3,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        color="primary.main"
                        sx={{ lineHeight: 1.4 }}
                      >
                        {lesson.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: "26px", mb: 1 }}
                    >
                      {lesson.theme}
                    </Typography>
                    {lesson.status === "COMPLETED" && (
                      <Chip
                        icon={<CheckIcon sx={{ fontSize: 16 }} />}
                        label="Ukończona"
                        size="small"
                        color="success"
                        sx={{ ml: "26px", fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    )}
                    {lesson.status === "IN_PROGRESS" && (
                      <Chip
                        label="W trakcie"
                        size="small"
                        color="warning"
                        sx={{ ml: "26px", fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    {lesson.status === "COMPLETED" ? (
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        disabled
                        startIcon={<CheckIcon />}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Ukończona
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<PlayIcon />}
                        onClick={() => navigate(`/student/lesson/${lesson.id}`)}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        {lesson.status === "IN_PROGRESS"
                          ? "Kontynuuj lekcję"
                          : "Rozpocznij lekcję"}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
