import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Container } from "@mui/material";
import { ArrowBackOutlined as BackIcon } from "@mui/icons-material";
import {
  lessonService,
  type LessonResultDetailsResponse,
} from "@/api/lessonService";
import { userService, type UserProfile } from "@/api/userService";
import { useAuth } from "@/context/AuthContext";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import { LessonResultDetailsPanel } from "@/components/results/LessonResultDetailsPanel";
import { getErrorMessage } from "@/utils/dashboardUtils";

export function TeacherLessonResultView() {
  const { lessonId, userId } = useParams<{
    lessonId: string;
    userId: string;
  }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const numericLessonId = Number(lessonId);
  const numericUserId = Number(userId);
  const routeError =
    Number.isNaN(numericLessonId) || Number.isNaN(numericUserId)
      ? "Nieprawidlowy identyfikator wyniku."
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

    lessonService
      .getLessonResultDetails(numericLessonId, numericUserId)
      .then(setResult)
      .catch((err: unknown) =>
        setError(
          getErrorMessage(
            err,
            "Nie udalo sie pobrac szczegolow wyniku ucznia.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [numericLessonId, numericUserId, routeError]);

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
          subtitle="Panel nauczyciela"
          fallbackName="Nauczycielu"
          user={user}
          onUserUpdated={setUser}
        />

        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/teacher/lessons/${lessonId}/stats`)}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            mb: { xs: 2, sm: 3 },
            mt: { xs: 0.5, sm: 1 },
          }}
        >
          Powrot do wynikow lekcji
        </Button>

        {!routeError && loading && <CircularProgress />}
        {(routeError || error) && (
          <Alert severity="error">{routeError ?? error}</Alert>
        )}
        {result && !loading && !routeError && (
          <LessonResultDetailsPanel
            result={result}
            performerLabel={result.username}
          />
        )}
      </Container>
    </Box>
  );
}
