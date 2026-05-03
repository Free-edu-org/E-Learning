import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Container } from "@mui/material";
import { ArrowBackOutlined as BackIcon } from "@mui/icons-material";
import {
  studentService,
  type LessonResultDetailsResponse,
} from "@/api/studentService";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { LessonResultDetailsPanel } from "@/components/results/LessonResultDetailsPanel";
import { userService, type UserProfile } from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/dashboardUtils";

export function StudentLessonResultView() {
  const { lessonPublicId } = useParams<{ lessonPublicId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const routeError = !lessonPublicId
    ? "Nieprawidlowy identyfikator lekcji."
    : null;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<LessonResultDetailsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setUser)
      .catch(() => undefined)
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (routeError) {
      return;
    }

    studentService
      .getLessonResultDetails(lessonPublicId!)
      .then(setResult)
      .catch((err: unknown) =>
        setError(
          getErrorMessage(
            err,
            "Nie udalo sie pobrac szczegolow wyniku lekcji.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [lessonPublicId, routeError]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "background.default" : "#eef1f8",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          pt: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 4, md: 6 },
          px: { xs: 2, sm: 3 },
          position: "relative",
        }}
      >
        <DashboardTopBar onLogout={logout} />
        <DashboardHeader
          loading={loadingUser}
          username={user?.username}
          subtitle="Panel ucznia"
          fallbackName="Uczniu"
          user={user}
          onUserUpdated={setUser}
        />

        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/student")}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            mb: { xs: 2, sm: 3 },
            mt: { xs: 0.5, sm: 1 },
          }}
        >
          Powrot do panelu
        </Button>

        {!routeError && loading && <CircularProgress />}
        {(routeError || error) && (
          <Alert severity="error">{routeError ?? error}</Alert>
        )}
        {result && !loading && !routeError && (
          <LessonResultDetailsPanel result={result} />
        )}
      </Container>
    </Box>
  );
}
