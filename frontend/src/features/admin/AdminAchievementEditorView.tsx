import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AddCircleOutline as AddCircleIcon,
  ArrowBackOutlined as BackIcon,
  SaveOutlined as SaveIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import {
  adminService,
  type AchievementType,
  type CreateAchievementRequest,
  type UpdateAchievementRequest,
  type AdminAchievement,
} from "@/api/adminService";
import { ApiError } from "@/api/apiClient";
import type { StudentAchievement } from "@/api/studentService";
import { userService, type UserProfile } from "@/api/userService";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/ui/dialog/AppDialog";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import {
  FormActions,
  FormField,
  FormSection,
} from "@/components/ui/form/FormLayout";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  outlinedMetaChipSx,
  panelFooterButtonSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";
import {
  getAchievementDescription,
  getAchievementIcon,
  getAchievementTitle,
  getAchievementVisuals,
  resolveAchievementColor,
} from "@/components/achievements/achievementPresentation";
import { useAuth } from "@/context/AuthContext";
import { INPUT_LIMITS } from "@/utils/inputLimits";
import { getApiErrorMessage, getErrorMessage } from "@/utils/dashboardUtils";

type AchievementEditorMode = "create" | "edit";

type AchievementDraft = {
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: AchievementType;
  threshold: string;
  active: boolean;
  sortOrder: string;
};

type AchievementFieldErrors = Partial<
  Record<
    | "code"
    | "title"
    | "description"
    | "icon"
    | "color"
    | "type"
    | "threshold"
    | "sortOrder",
    string
  >
>;

const ACHIEVEMENT_TYPE_OPTIONS: Array<{
  value: AchievementType;
  label: string;
  hint: string;
}> = [
  {
    value: "LESSONS_COMPLETED",
    label: "Ukończone lekcje",
    hint: "Lekcje ukończone.",
  },
  {
    value: "POINTS",
    label: "Punkty",
    hint: "Suma punktów.",
  },
  {
    value: "AVATAR_CHANGED",
    label: "Zmiana avatara",
    hint: "Bez progu.",
  },
];

const ACHIEVEMENT_COLOR_OPTIONS = [
  { value: "warning", label: "Złoty akcent" },
  { value: "info", label: "Niebieski akcent" },
  { value: "success", label: "Zielony akcent" },
  { value: "primary", label: "Domyślny akcent" },
  { value: "secondary", label: "Dodatkowy akcent" },
  { value: "error", label: "Czerwony akcent" },
] as const;

const ACHIEVEMENT_ICON_PICKER_OPTIONS = [
  "🏆",
  "⭐",
  "🎯",
  "🔥",
  "📚",
  "🎨",
  "🚀",
  "💎",
  "🥇",
  "✅",
  "🌟",
  "🏅",
  "🧠",
  "💡",
  "🎓",
  "🎵",
  "🎮",
  "🧪",
  "🌍",
  "⚡",
  "🧩",
  "📝",
  "💻",
  "🌈",
];

const CODE_REGEX = /^[A-Z][A-Z0-9_]*$/;

const achievementFieldLabels: Record<string, string> = {
  code: "Kod techniczny",
  title: "Nazwa osiągnięcia",
  description: "Opis",
  icon: "Ikona",
  color: "Kolor",
  type: "Warunek zdobycia",
  threshold: "Próg",
  active: "Aktywne",
  sortOrder: "Kolejność wyświetlania",
};

const emptyAchievementDraft: AchievementDraft = {
  code: "",
  title: "",
  description: "",
  icon: "🏆",
  color: "warning",
  type: "LESSONS_COMPLETED",
  threshold: "1",
  active: true,
  sortOrder: "0",
};

function normalizeCodeInput(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+/, "");
}

function normalizeNonNegativeIntegerInput(value: string) {
  const sanitized = value.replace(/[^\d]/g, "");
  return sanitized;
}

function buildDraftFromAchievement(
  achievement: AdminAchievement,
): AchievementDraft {
  return {
    code: achievement.code,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    color: resolveAchievementColor(achievement.color),
    type: achievement.type,
    threshold:
      achievement.threshold == null ? "" : String(achievement.threshold),
    active: achievement.active,
    sortOrder: String(achievement.sortOrder),
  };
}

function getTypeLabel(type: AchievementType) {
  return (
    ACHIEVEMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    type
  );
}

function getDisplayIcon(icon?: string) {
  const normalized = getAchievementIcon(icon).trim().replace(/\s+/g, " ");

  if (!normalized || /[\r\n\t]/.test(normalized)) {
    return "🏅";
  }

  return Array.from(normalized).length <= 4 ? normalized : "🏅";
}

function translateAchievementValidationDetail(detail: string) {
  if (
    detail === "must not be blank" ||
    detail === "must not be null" ||
    detail === "must not be empty"
  ) {
    return "Pole jest wymagane.";
  }

  if (
    detail === "must be greater than 0" ||
    detail === "must be greater than or equal to 1"
  ) {
    return "Wartość musi być większa od 0.";
  }

  if (detail === "must be greater than or equal to 0") {
    return "Wartość nie może być mniejsza od 0.";
  }

  if (detail.includes("uppercase snake_case")) {
    return "Kod może zawierać tylko wielkie litery, cyfry i podkreślenia.";
  }

  if (detail.includes("immutable")) {
    return "To pole nie może zostać zmienione po utworzeniu achievementu.";
  }

  return detail;
}

function parseAchievementApiFieldErrors(
  error: ApiError,
): AchievementFieldErrors {
  const detail = error.problem.detail ?? "";
  if (!detail.startsWith("Validation failed:")) {
    return {};
  }

  return detail
    .replace("Validation failed:", "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<AchievementFieldErrors>((acc, part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) {
        return acc;
      }

      const field = part.slice(0, separatorIndex).trim();
      const validationDetail = part.slice(separatorIndex + 1).trim();
      if (!(field in achievementFieldLabels)) {
        return acc;
      }

      acc[field as keyof AchievementFieldErrors] =
        translateAchievementValidationDetail(validationDetail);
      return acc;
    }, {});
}

function getAchievementApiErrorState(
  error: unknown,
  fallback: string,
): { message: string; fieldErrors: AchievementFieldErrors } {
  if (!(error instanceof ApiError)) {
    return { message: getErrorMessage(error, fallback), fieldErrors: {} };
  }

  const fieldErrors = parseAchievementApiFieldErrors(error);
  const code = error.problem.code?.toUpperCase() ?? "";
  const detail = error.problem.detail ?? "";

  if (
    error.problem.status === 409 ||
    code.includes("ALREADY_EXISTS") ||
    code.includes("DUPLICATE") ||
    /duplicate|already exists|already taken|already used/i.test(detail)
  ) {
    return {
      message: "Osiągnięcie o takim kodzie już istnieje.",
      fieldErrors: { ...fieldErrors, code: "Ten kod jest już zajęty." },
    };
  }

  if (error.problem.status === 404) {
    return {
      message: "Nie znaleziono wskazanego achievementu.",
      fieldErrors,
    };
  }

  if (error.problem.status === 403) {
    return {
      message: "Brak uprawnień do zarządzania achievementami.",
      fieldErrors,
    };
  }

  if (/immutable/i.test(detail)) {
    return {
      message:
        "Nie można zmienić pola, które po utworzeniu achievementu jest stałe.",
      fieldErrors,
    };
  }

  return {
    message: getApiErrorMessage(error, fallback, achievementFieldLabels),
    fieldErrors,
  };
}

function validateAchievementDraft(
  draft: AchievementDraft,
  mode: AchievementEditorMode,
): AchievementFieldErrors {
  const nextErrors: AchievementFieldErrors = {};

  if (mode === "create") {
    if (!draft.code.trim()) {
      nextErrors.code = 'Uzupełnij pole "Kod techniczny".';
    } else if (!CODE_REGEX.test(draft.code.trim())) {
      nextErrors.code =
        "Kod może zawierać tylko wielkie litery, cyfry i podkreślenia.";
    }
  }

  if (!draft.title.trim()) {
    nextErrors.title = 'Uzupełnij pole "Nazwa osiągnięcia".';
  }

  if (!draft.description.trim()) {
    nextErrors.description = 'Uzupełnij pole "Opis".';
  }

  if (!draft.icon.trim()) {
    nextErrors.icon = 'Uzupełnij pole "Ikona".';
  }

  if (!draft.color.trim()) {
    nextErrors.color = 'Uzupełnij pole "Kolor".';
  } else if (
    !ACHIEVEMENT_COLOR_OPTIONS.some((option) => option.value === draft.color)
  ) {
    nextErrors.color = "Wybierz jeden z dostępnych kolorów.";
  }

  if (mode === "create" && !draft.type) {
    nextErrors.type = "Wybierz warunek zdobycia.";
  }

  if (draft.type === "AVATAR_CHANGED") {
    if (draft.threshold.trim()) {
      nextErrors.threshold = "Dla zmiany avatara próg nie jest wymagany.";
    }
  } else if (!draft.threshold.trim()) {
    nextErrors.threshold = 'Uzupełnij pole "Próg".';
  } else {
    const threshold = Number(draft.threshold);
    if (!Number.isInteger(threshold) || threshold <= 0) {
      nextErrors.threshold =
        draft.type === "POINTS"
          ? "Dla punktów podaj próg większy od 0."
          : "Dla ukończonych lekcji podaj próg większy od 0.";
    }
  }

  if (!draft.sortOrder.trim()) {
    nextErrors.sortOrder = 'Uzupełnij pole "Kolejność".';
  } else {
    const sortOrder = Number(draft.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      nextErrors.sortOrder =
        "Kolejność musi być liczbą całkowitą większą lub równą 0.";
    }
  }

  return nextErrors;
}

function buildCreateAchievementPayload(
  draft: AchievementDraft,
): CreateAchievementRequest {
  return {
    code: draft.code.trim(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    icon: draft.icon.trim(),
    color: resolveAchievementColor(draft.color),
    type: draft.type,
    threshold: draft.type === "AVATAR_CHANGED" ? null : Number(draft.threshold),
    active: draft.active,
    sortOrder: Number(draft.sortOrder),
  };
}

function buildUpdateAchievementPayload(
  draft: AchievementDraft,
): UpdateAchievementRequest {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    icon: draft.icon.trim(),
    color: resolveAchievementColor(draft.color),
    threshold: draft.type === "AVATAR_CHANGED" ? null : Number(draft.threshold),
    active: draft.active,
    sortOrder: Number(draft.sortOrder),
  };
}

export function AdminAchievementEditorView({
  mode,
}: {
  mode: AchievementEditorMode;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const theme = useTheme();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);
  const [currentUserError, setCurrentUserError] = useState<string | null>(null);

  const [draft, setDraft] = useState<AchievementDraft>(emptyAchievementDraft);
  const [fieldErrors, setFieldErrors] = useState<AchievementFieldErrors>({});
  const [detailsLoading, setDetailsLoading] = useState(mode === "edit");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [savedDraftSignature, setSavedDraftSignature] = useState(() =>
    JSON.stringify(emptyAchievementDraft),
  );
  const [pageFeedback, setPageFeedback] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const pageBg =
    theme.palette.mode === "light"
      ? "#eef1f8"
      : theme.palette.background.default;

  useEffect(() => {
    let ignore = false;

    userService
      .getCurrentUser()
      .then((user) => {
        if (!ignore) {
          setCurrentUser(user);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setCurrentUserError(
            getAchievementApiErrorState(
              error,
              "Nie udało się pobrać profilu administratora.",
            ).message,
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingCurrentUser(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const loadAchievement = useCallback(async () => {
    if (mode !== "edit" || !code) {
      return;
    }

    setDetailsLoading(true);
    setPageFeedback(null);

    try {
      const achievement = await adminService.getAdminAchievement(code);
      const nextDraft = buildDraftFromAchievement(achievement);
      setDraft(nextDraft);
      setSavedDraftSignature(JSON.stringify(nextDraft));
    } catch (error) {
      setPageFeedback({
        severity: "error",
        message: getAchievementApiErrorState(
          error,
          "Nie udało się pobrać szczegółów achievementu.",
        ).message,
      });
    } finally {
      setDetailsLoading(false);
    }
  }, [code, mode]);

  useEffect(() => {
    void loadAchievement();
  }, [loadAchievement]);

  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    if (draftSignature === savedDraftSignature) {
      navigate("/admin/achievements");
      return;
    }

    setLeaveDialogOpen(true);
  };

  const thresholdDisabled = draft.type === "AVATAR_CHANGED";
  const typeHint =
    ACHIEVEMENT_TYPE_OPTIONS.find((option) => option.value === draft.type)
      ?.hint ?? "";
  const draftPreviewIcon = getDisplayIcon(draft.icon);
  const draftColorVisuals = getAchievementVisuals(theme, draft.color);

  const pageTitle =
    mode === "create" ? "Nowe osiągnięcie" : "Edytuj osiągnięcie";
  const pageSubtitle =
    mode === "create"
      ? "Uzupełnij dane achievementu i zapisz go jako osobny wpis."
      : "Zmień nazwę, opis, próg lub aktywność bez naruszania stałych pól systemowych.";

  const handleSubmit = async () => {
    const nextFieldErrors = validateAchievementDraft(draft, mode);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    if (mode === "edit" && !code) {
      setPageFeedback({
        severity: "error",
        message: "Brakuje kodu achievementu do edycji.",
      });
      return;
    }

    setSubmitLoading(true);
    setFieldErrors({});
    setPageFeedback(null);

    try {
      if (mode === "create") {
        await adminService.createAchievement(
          buildCreateAchievementPayload(draft),
        );
      } else {
        await adminService.updateAchievement(
          code!,
          buildUpdateAchievementPayload(draft),
        );
      }

      navigate("/admin/achievements", {
        state: {
          snackbar: {
            severity: "success" as const,
            message:
              mode === "create"
                ? "Achievement został utworzony."
                : "Achievement został zapisany.",
          },
        },
      });
    } catch (error) {
      const errorState = getAchievementApiErrorState(
        error,
        mode === "create"
          ? "Nie udało się utworzyć achievementu."
          : "Nie udało się zapisać zmian achievementu.",
      );
      setFieldErrors((current) => ({ ...current, ...errorState.fieldErrors }));
      setPageFeedback({
        severity: "error",
        message: errorState.message,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const previewCode = useMemo(() => {
    if (mode === "edit" && code) {
      return code;
    }

    return draft.code || "Jeszcze nie ustawiono";
  }, [code, draft.code, mode]);

  const previewAchievement = useMemo<StudentAchievement>(
    () => ({
      id: 0,
      title: getAchievementTitle(draft.title),
      description: getAchievementDescription(draft.description),
      icon: getDisplayIcon(draft.icon),
      color: resolveAchievementColor(draft.color),
      unlocked: draft.active,
      unlockedAt: draft.active ? "2026-05-08T12:00:00" : null,
      newlyUnlocked: false,
    }),
    [draft],
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: pageBg,
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
        <DashboardTopBar onLogout={handleLogout} />
        <DashboardHeader
          loading={loadingCurrentUser}
          username={currentUser?.username}
          subtitle="Zarządzanie achievementami"
          fallbackName="Administratorze"
          user={currentUser}
          onUserUpdated={setCurrentUser}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: { xs: 1.5, sm: 2 },
            flexWrap: "wrap",
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ minWidth: 0, width: "100%" }}>
            <Button
              startIcon={<BackIcon />}
              onClick={handleBack}
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                mb: 1.5,
                color: "text.secondary",
                "&:hover": { color: "text.primary" },
                "& .MuiButton-startIcon": { mr: 0.5 },
              }}
            >
              Powrót do listy achievementów
            </Button>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.5rem",
                  flexShrink: 0,
                  bgcolor: (theme) =>
                    alpha(
                      draftColorVisuals.accent,
                      theme.palette.mode === "dark" ? 0.15 : 0.1,
                    ),
                  border: "1.5px solid",
                  borderColor: (theme) =>
                    alpha(
                      draftColorVisuals.accent,
                      theme.palette.mode === "dark" ? 0.3 : 0.22,
                    ),
                  transition: "all 0.2s ease",
                }}
              >
                {draftPreviewIcon}
              </Box>
              <Stack spacing={0.3}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: "1.4rem", sm: "1.8rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    {pageTitle}
                  </Typography>
                  <Chip
                    label={mode === "create" ? "Nowe" : "Edycja"}
                    size="small"
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: "0.68rem",
                      letterSpacing: "0.03em",
                      ...(mode === "create"
                        ? {
                            bgcolor: (theme) =>
                              alpha(theme.palette.primary.main, 0.12),
                            color: "primary.main",
                            border: "1px solid",
                            borderColor: (theme) =>
                              alpha(theme.palette.primary.main, 0.25),
                          }
                        : {
                            bgcolor: (theme) =>
                              alpha(theme.palette.text.secondary, 0.08),
                            color: "text.secondary",
                            border: "1px solid",
                            borderColor: (theme) =>
                              alpha(theme.palette.divider, 0.3),
                          }),
                    }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: { md: 720 } }}
                >
                  {pageSubtitle}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        {currentUserError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {currentUserError}
          </Alert>
        )}

        {pageFeedback && (
          <Alert severity={pageFeedback.severity} sx={{ mb: 3 }}>
            {pageFeedback.message}
          </Alert>
        )}

        {detailsLoading ? (
          <Paper elevation={0} sx={{ ...panelSurfaceSx, p: 4 }}>
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress size={30} />
            </Stack>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
              gap: { xs: 2.5, md: 3 },
              alignItems: "stretch",
            }}
          >
            <Stack
              spacing={{ xs: 2, md: 2.25 }}
              sx={{ minWidth: 0, height: "100%" }}
            >
              <FormSection
                title="Dane podstawowe"
                description="Kod techniczny i warunek zdobycia ustawiasz przy tworzeniu. Po zapisaniu nie można ich zmienić."
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2.5}
                  alignItems="stretch"
                >
                  {/* Left: 3 fields */}
                  <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                    <FormField>
                      <TextField
                        label="Kod techniczny"
                        value={draft.code}
                        onChange={(event) => {
                          const nextCode = normalizeCodeInput(
                            event.target.value,
                          );
                          setDraft((current) => ({
                            ...current,
                            code: nextCode,
                          }));
                          setFieldErrors((current) => ({
                            ...current,
                            code: undefined,
                          }));
                        }}
                        disabled={mode === "edit"}
                        error={Boolean(fieldErrors.code)}
                        helperText={
                          fieldErrors.code ??
                          (mode === "edit"
                            ? "Stały identyfikator – nie można zmienić po zapisaniu."
                            : "Unikalny identyfikator. Tylko wielkie litery, cyfry i podkreślenia.")
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                      />
                    </FormField>
                    <FormField>
                      <TextField
                        label="Warunek zdobycia"
                        select
                        value={draft.type}
                        onChange={(event) => {
                          const nextType = event.target
                            .value as AchievementType;
                          setDraft((current) => ({
                            ...current,
                            type: nextType,
                            threshold:
                              nextType === "AVATAR_CHANGED"
                                ? ""
                                : current.threshold || "1",
                          }));
                          setFieldErrors((current) => ({
                            ...current,
                            type: undefined,
                            threshold: undefined,
                          }));
                        }}
                        disabled={mode === "edit"}
                        error={Boolean(fieldErrors.type)}
                        helperText={
                          fieldErrors.type ??
                          (typeHint
                            ? `Określa zasadę odblokowania. ${typeHint}`
                            : "Określa zasadę odblokowania achievementu.")
                        }
                        fullWidth
                        size="small"
                      >
                        {ACHIEVEMENT_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </FormField>
                    <FormField>
                      <TextField
                        label="Nazwa osiągnięcia"
                        value={draft.title}
                        onChange={(event) => {
                          const value = event.target.value.slice(
                            0,
                            INPUT_LIMITS.achievementTitle,
                          );
                          setDraft((current) => ({ ...current, title: value }));
                          setFieldErrors((current) => ({
                            ...current,
                            title: undefined,
                          }));
                        }}
                        error={Boolean(fieldErrors.title)}
                        helperText={
                          fieldErrors.title ??
                          `Widoczna nazwa w panelu ucznia. (${draft.title.length}/${INPUT_LIMITS.achievementTitle})`
                        }
                        inputProps={{
                          maxLength: INPUT_LIMITS.achievementTitle,
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                      />
                    </FormField>
                  </Stack>

                  {/* Right: icon picker */}
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: fieldErrors.icon
                          ? "error.main"
                          : (theme) =>
                              alpha(
                                theme.palette.divider,
                                theme.palette.mode === "dark" ? 0.28 : 0.42,
                              ),
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          borderBottom: "1px solid",
                          borderColor: (theme) =>
                            alpha(
                              theme.palette.divider,
                              theme.palette.mode === "dark" ? 0.16 : 0.3,
                            ),
                          px: 1.5,
                          py: 0.75,
                          bgcolor: (theme) =>
                            alpha(theme.palette.background.paper, 0.6),
                          flexShrink: 0,
                        }}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                        >
                          Ikona
                        </Typography>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            fontSize: "1.1rem",
                            bgcolor: alpha(draftColorVisuals.accent, 0.1),
                            border: "1.5px solid",
                            borderColor: alpha(draftColorVisuals.accent, 0.3),
                            boxShadow: `0 2px 8px ${alpha(draftColorVisuals.accent, 0.18)}`,
                            transition: "all 0.2s ease",
                          }}
                        >
                          {draftPreviewIcon}
                        </Box>
                      </Stack>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(6, 1fr)",
                          gap: 0.75,
                          p: 1,
                          flex: 1,
                          overflowY: "auto",
                          alignContent: "start",
                          "&::-webkit-scrollbar": { width: 3 },
                          "&::-webkit-scrollbar-thumb": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.divider, 0.2),
                            borderRadius: 2,
                          },
                        }}
                      >
                        {ACHIEVEMENT_ICON_PICKER_OPTIONS.map((iconOption) => {
                          const isIconSelected =
                            getDisplayIcon(draft.icon) === iconOption;
                          return (
                            <Box
                              key={iconOption}
                              onClick={() => {
                                setDraft((current) => ({
                                  ...current,
                                  icon: iconOption,
                                }));
                                setFieldErrors((current) => ({
                                  ...current,
                                  icon: undefined,
                                }));
                              }}
                              sx={{
                                height: 34,
                                display: "grid",
                                placeItems: "center",
                                fontSize: "1rem",
                                borderRadius: 1.25,
                                cursor: "pointer",
                                userSelect: "none",
                                border: "1.5px solid",
                                borderColor: isIconSelected
                                  ? alpha(draftColorVisuals.accent, 0.6)
                                  : (theme) =>
                                      alpha(theme.palette.divider, 0.1),
                                bgcolor: isIconSelected
                                  ? alpha(draftColorVisuals.accent, 0.12)
                                  : (theme) =>
                                      alpha(
                                        theme.palette.text.primary,
                                        theme.palette.mode === "dark"
                                          ? 0.04
                                          : 0.02,
                                      ),
                                boxShadow: isIconSelected
                                  ? `0 0 0 2px ${alpha(draftColorVisuals.accent, 0.2)}`
                                  : "none",
                                transition: "all 0.12s ease",
                                "&:hover": {
                                  bgcolor: isIconSelected
                                    ? alpha(draftColorVisuals.accent, 0.18)
                                    : (theme) =>
                                        alpha(theme.palette.primary.main, 0.07),
                                  borderColor: isIconSelected
                                    ? alpha(draftColorVisuals.accent, 0.75)
                                    : (theme) =>
                                        alpha(theme.palette.primary.main, 0.3),
                                  transform: "scale(1.08)",
                                },
                              }}
                            >
                              {iconOption}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color={fieldErrors.icon ? "error" : "text.secondary"}
                      sx={{ px: 1.75, lineHeight: 1.4 }}
                    >
                      {fieldErrors.icon ??
                        "Wybierz gotową ikonę albo wpisz własne emoji w polu tekstowym."}
                    </Typography>
                  </Stack>
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <FormField>
                      <TextField
                        label="Opis"
                        value={draft.description}
                        onChange={(event) => {
                          const value = event.target.value.slice(
                            0,
                            INPUT_LIMITS.achievementDescription,
                          );
                          setDraft((current) => ({
                            ...current,
                            description: value,
                          }));
                          setFieldErrors((current) => ({
                            ...current,
                            description: undefined,
                          }));
                        }}
                        error={Boolean(fieldErrors.description)}
                        helperText={
                          fieldErrors.description ??
                          `Krótki opis widoczny pod nazwą w panelu ucznia. (${draft.description.length}/${INPUT_LIMITS.achievementDescription})`
                        }
                        multiline
                        rows={3}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </FormField>
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection
                title="Warunki i prezentacja"
                description="Próg, aktywność i kolejność wyświetlania."
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormField>
                      <TextField
                        label="Kolor"
                        select
                        value={draft.color}
                        onChange={(event) => {
                          setDraft((current) => ({
                            ...current,
                            color: event.target.value,
                          }));
                          setFieldErrors((current) => ({
                            ...current,
                            color: undefined,
                          }));
                        }}
                        error={Boolean(fieldErrors.color)}
                        helperText={
                          fieldErrors.color ??
                          "Wpływa na kolorystykę karty achievementu w panelu ucznia."
                        }
                        fullWidth
                        size="small"
                      >
                        {ACHIEVEMENT_COLOR_OPTIONS.map((option) => {
                          const optionVisuals = getAchievementVisuals(
                            theme,
                            option.value,
                          );
                          return (
                            <MenuItem key={option.value} value={option.value}>
                              <Stack
                                direction="row"
                                spacing={1.25}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: optionVisuals.accent,
                                    flexShrink: 0,
                                    boxShadow: `0 0 0 2px ${alpha(optionVisuals.accent, 0.2)}`,
                                  }}
                                />
                                {option.label}
                              </Stack>
                            </MenuItem>
                          );
                        })}
                      </TextField>
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormField>
                      <TextField
                        label="Próg zdobycia"
                        type="number"
                        value={draft.threshold}
                        disabled={thresholdDisabled}
                        onChange={(event) => {
                          const value = normalizeNonNegativeIntegerInput(
                            event.target.value,
                          );
                          setDraft((current) => ({
                            ...current,
                            threshold: value,
                          }));
                          setFieldErrors((current) => ({
                            ...current,
                            threshold: undefined,
                          }));
                        }}
                        inputProps={{ min: 1, step: 1, inputMode: "numeric" }}
                        error={Boolean(fieldErrors.threshold)}
                        helperText={
                          fieldErrors.threshold ??
                          (thresholdDisabled
                            ? "Typ \u201eZmiana avatara\u201d nie wymaga progu – achievement odblokuje się automatycznie."
                            : draft.type === "POINTS"
                              ? "Minimalna liczba punktów wymagana do odblokowania achievementu."
                              : "Minimalna liczba ukończonych lekcji wymagana do odblokowania.")
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                      />
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormField>
                      <TextField
                        label="Kolejność wyświetlania"
                        type="number"
                        value={draft.sortOrder}
                        onChange={(event) => {
                          const value = normalizeNonNegativeIntegerInput(
                            event.target.value,
                          );
                          setDraft((current) => ({
                            ...current,
                            sortOrder: value,
                          }));
                          setFieldErrors((current) => ({
                            ...current,
                            sortOrder: undefined,
                          }));
                        }}
                        inputProps={{ min: 0, step: 1, inputMode: "numeric" }}
                        error={Boolean(fieldErrors.sortOrder)}
                        helperText={
                          fieldErrors.sortOrder ??
                          "Decyduje o kolejności na liście. Niższa wartość – wyższa pozycja."
                        }
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                      />
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormField>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 2,
                          py: 1.5,
                          borderRadius: 2.5,
                          border: "1.5px solid",
                          borderColor: draft.active
                            ? (theme) => alpha(theme.palette.success.main, 0.28)
                            : (theme) => alpha(theme.palette.divider, 0.22),
                          bgcolor: draft.active
                            ? (theme) => alpha(theme.palette.success.main, 0.04)
                            : (theme) => alpha(theme.palette.divider, 0.03),
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Stack spacing={0.2}>
                          <Typography variant="body2" fontWeight={600}>
                            {draft.active ? "Aktywne" : "Nieaktywne"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {draft.active
                              ? "Achievement jest widoczny dla uczniów."
                              : "Achievement jest ukryty dla uczniów."}
                          </Typography>
                        </Stack>
                        <Switch
                          checked={draft.active}
                          onChange={(_, checked) =>
                            setDraft((current) => ({
                              ...current,
                              active: checked,
                            }))
                          }
                          color="success"
                        />
                      </Box>
                    </FormField>
                  </Grid>
                </Grid>
              </FormSection>
            </Stack>

            <Stack
              spacing={{ xs: 2, md: 2.25 }}
              sx={{
                minWidth: 0,
                position: { lg: "sticky" },
                top: { lg: 24 },
                alignSelf: { lg: "flex-start" },
              }}
            >
              <FormSection
                title="Podgląd osiągnięcia"
                description="Tak będzie wyglądał w panelu ucznia."
              >
                <Stack spacing={2}>
                  <AchievementCard achievement={previewAchievement} />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`Kod techniczny: ${previewCode}`}
                      variant="outlined"
                      sx={outlinedMetaChipSx}
                    />
                    <Chip
                      label={`Warunek zdobycia: ${getTypeLabel(draft.type)}`}
                      variant="outlined"
                      sx={outlinedMetaChipSx}
                    />
                  </Stack>
                </Stack>
              </FormSection>

              <FormSection
                title="Akcje"
                description="Zapisz lub wróć do listy."
              >
                <FormActions>
                  <Button
                    onClick={handleBack}
                    disabled={submitLoading || detailsLoading}
                    sx={panelFooterButtonSx}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => void handleSubmit()}
                    disabled={submitLoading || detailsLoading}
                    startIcon={
                      submitLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : mode === "create" ? (
                        <AddCircleIcon />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    sx={{
                      ...panelFooterButtonSx,
                      boxShadow: "none",
                      fontWeight: 700,
                      px: 3,
                      py: 1,
                      borderRadius: 2.5,
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                      "&:hover": {
                        boxShadow: (theme) =>
                          `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
                        transform: "translateY(-1px)",
                      },
                      "&:active": { transform: "translateY(0)" },
                      "&.Mui-disabled": { background: undefined },
                      transition: "all 0.18s ease",
                    }}
                  >
                    {mode === "create" ? "Utwórz osiągnięcie" : "Zapisz zmiany"}
                  </Button>
                </FormActions>
              </FormSection>
            </Stack>
          </Box>
        )}
      </Container>

      <AppDialog
        open={leaveDialogOpen}
        onClose={() => {
          if (submitLoading) {
            return;
          }
          setLeaveDialogOpen(false);
        }}
        maxWidth="sm"
      >
        <AppDialogHeader
          icon={<BackIcon />}
          title={
            mode === "create"
              ? "Opuścić tworzenie achievementu?"
              : "Opuścić edycję achievementu?"
          }
          subtitle="Niezapisane zmiany zostaną usunięte."
        />
        <AppDialogBody>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Jeśli wrócisz teraz, wprowadzone zmiany w formularzu nie zostaną
              zapisane.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Możesz też zapisać achievement teraz i wrócić do listy później.
            </Typography>
          </Stack>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            onClick={() => setLeaveDialogOpen(false)}
            disabled={submitLoading}
            sx={{ ...panelFooterButtonSx, color: "text.secondary" }}
          >
            Zostań
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => navigate("/admin/achievements")}
            disabled={submitLoading}
            sx={panelFooterButtonSx}
          >
            Opuść bez zapisu
          </Button>
        </AppDialogFooter>
      </AppDialog>
    </Box>
  );
}
