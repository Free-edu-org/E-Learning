import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AddCircleOutline as AddCircleIcon,
  ArrowBackOutlined as BackIcon,
  AutoAwesomeOutlined as AchievementIcon,
  EditOutlined as EditIcon,
  RefreshOutlined as RefreshIcon,
  SearchOutlined as SearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  adminService,
  type AchievementType,
  type AdminAchievement,
  type CreateAchievementRequest,
  type UpdateAchievementRequest,
} from "@/api/adminService";
import { ApiError } from "@/api/apiClient";
import { userService, type UserProfile } from "@/api/userService";
import {
  AppDialog,
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogStatus,
} from "@/components/ui/dialog/AppDialog";
import {
  FormActions,
  FormField,
  FormSection,
} from "@/components/ui/form/FormLayout";
import { DashboardHeader } from "@/components/ui/panel/DashboardHeader";
import { DashboardTopBar } from "@/components/ui/panel/DashboardTopBar";
import {
  outlinedMetaChipSx,
  panelCardFooterSx,
  panelFooterButtonSx,
  panelGridCardContentSx,
  panelGridCardSx,
  panelIconButtonSx,
  panelInlineActionsSx,
  panelSingleLineSx,
  panelSurfaceSx,
  panelToolbarSx,
  panelTwoLinesSx,
} from "@/components/ui/panel/panelStyles";
import {
  getAchievementDescription,
  getAchievementIcon,
  getAchievementTitle,
  getAchievementVisuals,
  resolveAchievementColor,
} from "@/components/achievements/achievementPresentation";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage, getErrorMessage, formatDate } from "@/utils/dashboardUtils";

type AchievementDialogMode = "create" | "edit";

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

type DialogFeedbackState = {
  severity: "success" | "error";
  message: string;
};

type ConfirmToggleState = {
  code: string;
  title: string;
  active: boolean;
} | null;

const ACHIEVEMENT_TYPE_OPTIONS: Array<{
  value: AchievementType;
  label: string;
  hint: string;
}> = [
  {
    value: "LESSONS_COMPLETED",
    label: "Ukończone lekcje",
    hint: "Osiągnięcie zostanie zdobyte po ukończeniu określonej liczby lekcji.",
  },
  {
    value: "POINTS",
    label: "Punkty",
    hint: "Osiągnięcie zostanie zdobyte po osiągnięciu określonej liczby punktów.",
  },
  {
    value: "AVATAR_CHANGED",
    label: "Zmiana avatara",
    hint: "Osiągnięcie zostanie zdobyte po zmianie avatara, bez progu.",
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

const ACHIEVEMENT_ICON_OPTIONS = [
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

function getThresholdSummary(achievement: AdminAchievement) {
  if (achievement.type === "AVATAR_CHANGED") {
    return "Bez progu";
  }

  if (achievement.threshold == null) {
    return "Brak progu";
  }

  if (achievement.type === "POINTS") {
    return `Próg: ${achievement.threshold} punktów`;
  }

  return `Próg: ${achievement.threshold} ${
    achievement.threshold === 1 ? "lekcji" : "lekcji"
  }`;
}

function getDraftThresholdSummary(draft: AchievementDraft) {
  if (draft.type === "AVATAR_CHANGED") {
    return "Bez progu";
  }

  if (!draft.threshold.trim()) {
    return "Próg do uzupełnienia";
  }

  if (draft.type === "POINTS") {
    return `Próg: ${draft.threshold} punktów`;
  }

  return `Próg: ${draft.threshold} lekcji`;
}

function getColorLabel(color: string) {
  return (
    ACHIEVEMENT_COLOR_OPTIONS.find((option) => option.value === color)?.label ??
    ACHIEVEMENT_COLOR_OPTIONS.find(
      (option) => option.value === resolveAchievementColor(color),
    )?.label ??
    "Domyślny akcent"
  );
}

function getDisplayIcon(icon?: string) {
  const normalized = getAchievementIcon(icon).trim().replace(/\s+/g, " ");

  if (!normalized || /[\r\n\t]/.test(normalized)) {
    return "🏅";
  }

  return Array.from(normalized).length <= 4 ? normalized : "🏅";
}

function getStatusTone(active: boolean) {
  return active ? "success" : "default";
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

function parseAchievementApiFieldErrors(error: ApiError): AchievementFieldErrors {
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
  mode: AchievementDialogMode,
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
    nextErrors.type = 'Wybierz warunek zdobycia.';
  }

  if (draft.type === "AVATAR_CHANGED") {
    if (draft.threshold.trim()) {
      nextErrors.threshold = "Dla zmiany avatara próg nie jest wymagany.";
    }
  } else {
    if (!draft.threshold.trim()) {
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
    threshold:
      draft.type === "AVATAR_CHANGED" ? null : Number(draft.threshold),
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
    threshold:
      draft.type === "AVATAR_CHANGED" ? null : Number(draft.threshold),
    active: draft.active,
    sortOrder: Number(draft.sortOrder),
  };
}

function AchievementPreviewCard({ draft }: { draft: AchievementDraft }) {
  const theme = useTheme();
  const visuals = getAchievementVisuals(theme, draft.color);
  const title = getAchievementTitle(draft.title);
  const description = getAchievementDescription(draft.description);
  const icon = getDisplayIcon(draft.icon);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 3,
        border: "1px solid",
        borderColor: draft.active ? visuals.border : visuals.subduedBorder,
        bgcolor: draft.active
          ? visuals.softBackground
          : alpha(
              theme.palette.text.disabled,
              theme.palette.mode === "dark" ? 0.08 : 0.05,
            ),
        opacity: draft.active ? 1 : 0.82,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" spacing={1.5}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              bgcolor: draft.active
                ? visuals.strongBackground
                : alpha(
                    theme.palette.common.black,
                    theme.palette.mode === "dark" ? 0.14 : 0.04,
                  ),
            }}
          >
            {icon}
          </Box>

          <Chip
            size="small"
            label={draft.active ? "Aktywne" : "Nieaktywne"}
            color={draft.active ? visuals.paletteColor : "default"}
            variant={draft.active ? "filled" : "outlined"}
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.25 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
            {description}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={getTypeLabel(draft.type)} variant="outlined" sx={outlinedMetaChipSx} />
          <Chip label={getDraftThresholdSummary(draft)} variant="outlined" sx={outlinedMetaChipSx} />
          <Chip label={`Kolor: ${getColorLabel(draft.color)}`} variant="outlined" sx={outlinedMetaChipSx} />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Kolejność wyświetlania: {draft.sortOrder.trim() || "0"}
        </Typography>
      </Stack>
    </Paper>
  );
}

function AchievementListSkeleton() {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid key={index} size={{ xs: 12, md: 6, xl: 4 }}>
          <Card elevation={0} sx={panelGridCardSx}>
            <Box sx={panelGridCardContentSx}>
              <Skeleton variant="text" width="55%" height={36} />
              <Skeleton variant="text" width="35%" />
              <Skeleton variant="rounded" height={72} sx={{ mt: 1 }} />
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Skeleton variant="rounded" width={92} height={28} />
                <Skeleton variant="rounded" width={110} height={28} />
              </Stack>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function AdminAchievementsView() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);
  const [currentUserError, setCurrentUserError] = useState<string | null>(
    null,
  );

  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] =
    useState<AchievementDialogMode>("create");
  const [selectedAchievementCode, setSelectedAchievementCode] = useState<
    string | null
  >(null);
  const [draft, setDraft] = useState<AchievementDraft>(emptyAchievementDraft);
  const [fieldErrors, setFieldErrors] = useState<AchievementFieldErrors>({});
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogDetailsLoading, setDialogDetailsLoading] = useState(false);
  const [dialogFeedback, setDialogFeedback] =
    useState<DialogFeedbackState | null>(null);

  const [toggleDialog, setToggleDialog] = useState<ConfirmToggleState>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const pageBg =
    theme.palette.mode === "light"
      ? "#e8eef7"
      : theme.palette.background.default;

  const loadAchievements = useCallback(async () => {
    setLoadingAchievements(true);
    setAchievementsError(null);
    try {
      const nextAchievements = await adminService.getAdminAchievements();
      setAchievements(nextAchievements);
    } catch (error) {
      setAchievementsError(
        getAchievementApiErrorState(
          error,
          "Nie udało się pobrać listy achievementów.",
        ).message,
      );
    } finally {
      setLoadingAchievements(false);
    }
  }, []);

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

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  const filteredAchievements = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return achievements;
    }

    return achievements.filter((achievement) => {
      const haystack = [
        achievement.code,
        achievement.title,
        achievement.description,
        achievement.type,
        getTypeLabel(achievement.type),
        achievement.color,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [achievements, search]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const resetDialogState = () => {
    setFieldErrors({});
    setDialogFeedback(null);
    setDialogLoading(false);
    setDialogDetailsLoading(false);
    setSelectedAchievementCode(null);
    setDraft(emptyAchievementDraft);
  };

  const closeDialog = () => {
    if (dialogLoading || dialogDetailsLoading) {
      return;
    }

    setDialogOpen(false);
    resetDialogState();
  };

  const openCreateDialog = () => {
    setDialogMode("create");
    setDialogFeedback(null);
    setFieldErrors({});
    setSelectedAchievementCode(null);
    setDraft(emptyAchievementDraft);
    setDialogOpen(true);
  };

  const openEditDialog = async (code: string) => {
    setDialogMode("edit");
    setSelectedAchievementCode(code);
    setDialogFeedback(null);
    setFieldErrors({});
    setDialogOpen(true);
    setDialogDetailsLoading(true);

    try {
      const achievement = await adminService.getAdminAchievement(code);
      setDraft(buildDraftFromAchievement(achievement));
    } catch (error) {
      setDialogFeedback({
        severity: "error",
        message: getAchievementApiErrorState(
          error,
          "Nie udało się pobrać szczegółów achievementu.",
        ).message,
      });
    } finally {
      setDialogDetailsLoading(false);
    }
  };

  const submitDialog = async () => {
    const nextFieldErrors = validateAchievementDraft(draft, dialogMode);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setDialogLoading(true);
    setDialogFeedback(null);
    setFieldErrors({});

    try {
      if (dialogMode === "create") {
        await adminService.createAchievement(buildCreateAchievementPayload(draft));
        setSnackbar({
          severity: "success",
          message: "Achievement został utworzony.",
        });
      } else if (selectedAchievementCode) {
        await adminService.updateAchievement(
          selectedAchievementCode,
          buildUpdateAchievementPayload(draft),
        );
        setSnackbar({
          severity: "success",
          message: "Achievement został zapisany.",
        });
      }

      await loadAchievements();
      closeDialog();
    } catch (error) {
      const errorState = getAchievementApiErrorState(
        error,
        dialogMode === "create"
          ? "Nie udało się utworzyć achievementu."
          : "Nie udało się zapisać zmian achievementu.",
      );
      setFieldErrors((current) => ({ ...current, ...errorState.fieldErrors }));
      setDialogFeedback({
        severity: "error",
        message: errorState.message,
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const openToggleDialog = (achievement: AdminAchievement) => {
    setToggleDialog({
      code: achievement.code,
      title: achievement.title,
      active: achievement.active,
    });
  };

  const confirmToggleActive = async () => {
    if (!toggleDialog) {
      return;
    }

    setToggleLoading(true);
    try {
      await adminService.setAchievementActive(
        toggleDialog.code,
        !toggleDialog.active,
      );
      setSnackbar({
        severity: "success",
        message: toggleDialog.active
          ? "Achievement został wyłączony."
          : "Achievement został aktywowany.",
      });
      setToggleDialog(null);
      await loadAchievements();
    } catch (error) {
      setSnackbar({
        severity: "error",
        message: getAchievementApiErrorState(
          error,
          "Nie udało się zmienić statusu achievementu.",
        ).message,
      });
    } finally {
      setToggleLoading(false);
    }
  };

  const thresholdDisabled = draft.type === "AVATAR_CHANGED";
  const typeHint =
    ACHIEVEMENT_TYPE_OPTIONS.find((option) => option.value === draft.type)
      ?.hint ?? "";
  const draftPreviewIcon = getDisplayIcon(draft.icon);
  const draftColorVisuals = getAchievementVisuals(theme, draft.color);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: 4, position: "relative" }}>
        <DashboardTopBar onLogout={handleLogout} />

        <DashboardHeader
          loading={loadingCurrentUser}
          username={currentUser?.username}
          subtitle="Zarządzanie achievementami"
          fallbackName="Administratorze"
          user={currentUser}
          onUserUpdated={setCurrentUser}
        />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate("/admin")}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 700,
              px: 0,
            }}
          >
            Wróć do panelu administratora
          </Button>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <IconButton
              aria-label="Odśwież achievementy"
              onClick={() => void loadAchievements()}
              disabled={loadingAchievements}
              sx={panelIconButtonSx}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={openCreateDialog}
              sx={{ ...panelFooterButtonSx, px: 2.25, boxShadow: "none" }}
            >
              Nowy achievement
            </Button>
          </Stack>
        </Stack>

        {currentUserError && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            {currentUserError}
          </Alert>
        )}

        <Card elevation={0} sx={panelSurfaceSx}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={2}
                justifyContent="space-between"
              >
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight={800}>
                    Lista osiągnięć
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Twórz i edytuj osiągnięcia widoczne dla uczniów oraz decyduj,
                    które z nich są aktywne.
                  </Typography>
                </Stack>
              </Stack>

              <Paper elevation={0} sx={panelToolbarSx}>
                <TextField
                  size="small"
                  placeholder="Szukaj po nazwie, kodzie technicznym lub warunku"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    minWidth: { xs: "100%", md: 320 },
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      minHeight: 40,
                    },
                  }}
                />

                <Chip
                  label={`Łącznie: ${achievements.length}`}
                  variant="outlined"
                  sx={outlinedMetaChipSx}
                />
                <Chip
                  label={`Aktywne: ${achievements.filter((item) => item.active).length}`}
                  color="success"
                  variant="outlined"
                  sx={outlinedMetaChipSx}
                />
              </Paper>

              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Aktywne osiągnięcie jest widoczne dla uczniów i może zostać zdobyte. Nieaktywne osiągnięcie jest ukryte przed uczniami i nie będzie dalej zdobywane. Dezaktywacja nie usuwa historii już zdobytych osiągnięć.
              </Alert>

              {achievementsError && (
                <Alert
                  severity="warning"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => void loadAchievements()}
                    >
                      Ponów
                    </Button>
                  }
                >
                  {achievementsError}
                </Alert>
              )}

              {loadingAchievements ? (
                <AchievementListSkeleton />
              ) : achievements.length === 0 ? (
                <Alert
                  severity="info"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={openCreateDialog}
                    >
                      Dodaj pierwszy
                    </Button>
                  }
                >
                  Brak achievementów. Dodaj pierwszy wpis, aby udostępnić go w systemie.
                </Alert>
              ) : filteredAchievements.length === 0 ? (
                <Alert severity="info">
                  Brak achievementów pasujących do bieżącego wyszukiwania.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {filteredAchievements.map((achievement) => (
                    <Grid key={achievement.code} size={{ xs: 12, md: 6, xl: 4 }}>
                      <Card elevation={0} sx={panelGridCardSx}>
                        <Box sx={panelGridCardContentSx}>
                          {(() => {
                            const visuals = getAchievementVisuals(
                              theme,
                              achievement.color,
                            );
                            const icon = getDisplayIcon(achievement.icon);

                            return (
                              <>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="flex-start"
                            justifyContent="space-between"
                          >
                            <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                              <Box
                                sx={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 3,
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: 28,
                                  flexShrink: 0,
                                  color: visuals.accent,
                                  bgcolor: visuals.strongBackground,
                                  border: "1px solid",
                                  borderColor: visuals.border,
                                }}
                              >
                                {icon}
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" fontWeight={800} sx={panelSingleLineSx}>
                                  {achievement.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={panelSingleLineSx}
                                >
                                  Kod techniczny: {achievement.code}
                                </Typography>
                              </Box>
                            </Stack>

                            <Chip
                              label={achievement.active ? "Aktywny" : "Nieaktywny"}
                              color={getStatusTone(achievement.active)}
                              variant={achievement.active ? "filled" : "outlined"}
                              sx={{ flexShrink: 0 }}
                            />
                          </Stack>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ...panelTwoLinesSx, mt: 2 }}
                          >
                            {achievement.description}
                          </Typography>

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                            <Chip label={getTypeLabel(achievement.type)} variant="outlined" sx={outlinedMetaChipSx} />
                            <Chip label={getThresholdSummary(achievement)} variant="outlined" sx={outlinedMetaChipSx} />
                            <Chip label={`Kolejność: ${achievement.sortOrder}`} variant="outlined" sx={outlinedMetaChipSx} />
                            <Chip label={getColorLabel(resolveAchievementColor(achievement.color))} variant="outlined" sx={outlinedMetaChipSx} />
                          </Stack>

                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            Warunek zdobycia: {getTypeLabel(achievement.type)}
                          </Typography>

                          <Stack spacing={0.5} sx={{ mt: 2.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Ostatnia aktualizacja: {formatDate(achievement.updatedAt)}
                            </Typography>
                          </Stack>

                          <Box sx={panelCardFooterSx}>
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => void openEditDialog(achievement.code)}
                                sx={panelFooterButtonSx}
                              >
                                Edytuj
                              </Button>
                              <Box
                                sx={{
                                  minHeight: 40,
                                  px: 1.4,
                                  borderRadius: 999,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  border: "1px solid",
                                  borderColor: achievement.active
                                    ? alpha(theme.palette.success.main, 0.28)
                                    : alpha(theme.palette.divider, 0.9),
                                  bgcolor: achievement.active
                                    ? alpha(theme.palette.success.main, 0.08)
                                    : alpha(theme.palette.text.disabled, 0.06),
                                }}
                              >
                                <Switch
                                  checked={achievement.active}
                                  disabled={toggleLoading}
                                  onChange={() => openToggleDialog(achievement)}
                                  inputProps={{
                                    "aria-label": achievement.active
                                      ? `Dezaktywuj osiągnięcie ${achievement.title}`
                                      : `Aktywuj osiągnięcie ${achievement.title}`,
                                  }}
                                  color="success"
                                />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {achievement.active ? "Aktywne" : "Nieaktywne"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {achievement.active
                                      ? "Widoczne dla uczniów"
                                      : "Ukryte przed uczniami"}
                                  </Typography>
                                </Box>
                              </Box>
                            </Stack>
                            <Box sx={panelInlineActionsSx} />
                          </Box>
                              </>
                            );
                          })()}
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>

      <AppDialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        paperSx={{
          bgcolor: "background.paper",
        }}
      >
        <AppDialogHeader
          icon={<AchievementIcon />}
          title={dialogMode === "create" ? "Nowe osiągnięcie" : "Edytuj osiągnięcie"}
          subtitle={
            dialogMode === "create"
              ? "Uzupełnij dane osiągnięcia i wybierz warunek jego zdobycia."
              : "Zmień nazwę, opis, próg lub aktywność bez naruszania kodu technicznego i warunku."
          }
        />
        <AppDialogBody>
          {dialogFeedback && (
            <AppDialogStatus severity={dialogFeedback.severity}>
              {dialogFeedback.message}
            </AppDialogStatus>
          )}

          {dialogDetailsLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <FormSection
                title="Dane podstawowe"
                description="Kod techniczny i warunek zdobycia ustawiasz przy tworzeniu. Po zapisaniu nie można ich zmienić."
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormField>
                      <TextField
                        label="Kod techniczny"
                        value={draft.code}
                        onChange={(event) => {
                          const nextCode = normalizeCodeInput(event.target.value);
                          setDraft((current) => ({ ...current, code: nextCode }));
                          setFieldErrors((current) => ({ ...current, code: undefined }));
                        }}
                        disabled={dialogMode === "edit"}
                        error={Boolean(fieldErrors.code)}
                        helperText={
                          fieldErrors.code ??
                          (dialogMode === "edit"
                            ? "Stały identyfikator osiągnięcia używany przez system. Nie można go zmienić po utworzeniu."
                            : "Stały identyfikator osiągnięcia używany przez system. Po utworzeniu nie będzie można go zmienić. Używaj wielkich liter, cyfr i podkreśleń.")
                        }
                        fullWidth
                      />
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormField>
                      <TextField
                        label="Warunek zdobycia"
                        select
                        value={draft.type}
                        onChange={(event) => {
                          const nextType = event.target.value as AchievementType;
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
                        disabled={dialogMode === "edit"}
                        error={Boolean(fieldErrors.type)}
                        helperText={fieldErrors.type ?? typeHint}
                        fullWidth
                      >
                        {ACHIEVEMENT_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormField>
                      <TextField
                        label="Nazwa osiągnięcia"
                        value={draft.title}
                        onChange={(event) => {
                          setDraft((current) => ({ ...current, title: event.target.value }));
                          setFieldErrors((current) => ({ ...current, title: undefined }));
                        }}
                        error={Boolean(fieldErrors.title)}
                        helperText={fieldErrors.title}
                        fullWidth
                      />
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormField>
                      <Stack spacing={1.25}>
                        <TextField
                          label="Ikona"
                          value={draft.icon}
                          onChange={(event) => {
                            setDraft((current) => ({ ...current, icon: event.target.value }));
                            setFieldErrors((current) => ({ ...current, icon: undefined }));
                          }}
                          error={Boolean(fieldErrors.icon)}
                          helperText={
                            fieldErrors.icon ??
                            "Wybierz gotową ikonę albo wpisz własne krótkie emoji lub oznaczenie. Gdy wartość będzie pusta albo nieczytelna, panel pokaże ikonę domyślną."
                          }
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Box
                                    sx={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: 2,
                                      display: "grid",
                                      placeItems: "center",
                                      fontSize: 20,
                                      bgcolor: alpha(draftColorVisuals.accent, 0.12),
                                      border: "1px solid",
                                      borderColor: alpha(draftColorVisuals.accent, 0.24),
                                    }}
                                  >
                                    {draftPreviewIcon}
                                  </Box>
                                </InputAdornment>
                              ),
                            },
                          }}
                          fullWidth
                        />

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {ACHIEVEMENT_ICON_OPTIONS.map((iconOption) => (
                            <Chip
                              key={iconOption}
                              label={iconOption}
                              clickable
                              color={getDisplayIcon(draft.icon) === iconOption ? "primary" : "default"}
                              variant={getDisplayIcon(draft.icon) === iconOption ? "filled" : "outlined"}
                              onClick={() => {
                                setDraft((current) => ({ ...current, icon: iconOption }));
                                setFieldErrors((current) => ({ ...current, icon: undefined }));
                              }}
                              sx={{ minWidth: 44, justifyContent: "center" }}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormField>
                      <TextField
                        label="Opis"
                        value={draft.description}
                        onChange={(event) => {
                          setDraft((current) => ({ ...current, description: event.target.value }));
                          setFieldErrors((current) => ({ ...current, description: undefined }));
                        }}
                        error={Boolean(fieldErrors.description)}
                        helperText={fieldErrors.description}
                        multiline
                        minRows={3}
                        fullWidth
                      />
                    </FormField>
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection
                title="Warunki i prezentacja"
                description="Ustal próg, widoczność i kolejność wyświetlania osiągnięcia."
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
                            color: resolveAchievementColor(event.target.value),
                          }));
                          setFieldErrors((current) => ({ ...current, color: undefined }));
                        }}
                        error={Boolean(fieldErrors.color)}
                        helperText={fieldErrors.color ?? "Kolor wpływa na wygląd karty osiągnięcia w panelu ucznia."}
                        fullWidth
                      >
                        {ACHIEVEMENT_COLOR_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor: draftColorVisuals.accent,
                            border: "1px solid",
                            borderColor: alpha(draftColorVisuals.accent, 0.4),
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Podgląd koloru: {getColorLabel(draft.color)}
                        </Typography>
                      </Stack>
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
                          setDraft((current) => ({ ...current, threshold: event.target.value }));
                          setFieldErrors((current) => ({ ...current, threshold: undefined }));
                        }}
                        error={Boolean(fieldErrors.threshold)}
                        helperText={
                          fieldErrors.threshold ??
                          (thresholdDisabled
                            ? "Dla zmiany avatara próg nie jest wymagany."
                            : draft.type === "POINTS"
                              ? "Podaj liczbę punktów większą od 0."
                              : "Podaj liczbę ukończonych lekcji większą od 0.")
                        }
                        fullWidth
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
                          setDraft((current) => ({ ...current, sortOrder: event.target.value }));
                          setFieldErrors((current) => ({ ...current, sortOrder: undefined }));
                        }}
                        error={Boolean(fieldErrors.sortOrder)}
                        helperText={fieldErrors.sortOrder ?? "Określa kolejność wyświetlania osiągnięć na liście. Niższa liczba oznacza wyższą pozycję."}
                        fullWidth
                      />
                    </FormField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormField>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={draft.active}
                            onChange={(_, checked) =>
                              setDraft((current) => ({ ...current, active: checked }))
                            }
                          />
                        }
                        label={draft.active ? "Aktywne" : "Nieaktywne"}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                        Aktywne: osiągnięcie jest widoczne dla uczniów i może zostać zdobyte. Nieaktywne: osiągnięcie jest ukryte przed uczniami i nie będzie dalej zdobywane. Dezaktywacja nie usuwa historii już zdobytych osiągnięć.
                      </Typography>
                    </FormField>
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection
                title="Podgląd osiągnięcia"
                description="Tak osiągnięcie będzie prezentowało się w panelu ucznia. Podgląd odświeża się na bieżąco podczas edycji."
              >
                <Stack spacing={1.5}>
                  <AchievementPreviewCard draft={draft} />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`Kod techniczny: ${dialogMode === "edit" && selectedAchievementCode ? selectedAchievementCode : draft.code || "Jeszcze nie ustawiono"}`}
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
            </Stack>
          )}
        </AppDialogBody>

        <AppDialogFooter>
          <FormActions>
            <Button
              onClick={closeDialog}
              disabled={dialogLoading || dialogDetailsLoading}
              sx={panelFooterButtonSx}
            >
              Anuluj
            </Button>
            <Button
              variant="contained"
              onClick={() => void submitDialog()}
              disabled={dialogLoading || dialogDetailsLoading}
              startIcon={dialogLoading ? <CircularProgress size={16} color="inherit" /> : <AddCircleIcon />}
              sx={{ ...panelFooterButtonSx, boxShadow: "none" }}
            >
              {dialogMode === "create" ? "Utwórz osiągnięcie" : "Zapisz zmiany"}
            </Button>
          </FormActions>
        </AppDialogFooter>
      </AppDialog>

      <AppDialog
        open={toggleDialog != null}
        onClose={() => (toggleLoading ? undefined : setToggleDialog(null))}
        maxWidth="xs"
      >
        <AppDialogHeader
          icon={<AchievementIcon />}
          title={toggleDialog?.active ? "Ukryć osiągnięcie?" : "Aktywować osiągnięcie?"}
          subtitle={
            toggleDialog?.active
              ? "Zmiana statusu zapisze się od razu. Osiągnięcie zostanie ukryte przed uczniami, ale historia już zdobytych osiągnięć pozostanie bez zmian."
              : "Zmiana statusu zapisze się od razu. Osiągnięcie znów będzie widoczne dla uczniów i będzie mogło zostać zdobyte."
          }
        />
        <AppDialogBody>
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {toggleDialog
                ? `Potwierdź zmianę statusu dla osiągnięcia „${toggleDialog.title}”. Kod techniczny: ${toggleDialog.code}.`
                : ""}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Aktywne: osiągnięcie jest widoczne dla uczniów i może zostać zdobyte.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Nieaktywne: osiągnięcie jest ukryte przed uczniami i nie będzie dalej zdobywane.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dezaktywacja nie usuwa historii już zdobytych osiągnięć.
            </Typography>
          </Stack>
        </AppDialogBody>
        <AppDialogFooter>
          <Button
            onClick={() => setToggleDialog(null)}
            disabled={toggleLoading}
            sx={panelFooterButtonSx}
          >
            Anuluj
          </Button>
          <Button
            variant="contained"
            color={toggleDialog?.active ? "warning" : "success"}
            onClick={() => void confirmToggleActive()}
            disabled={toggleLoading}
            startIcon={toggleLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ ...panelFooterButtonSx, boxShadow: "none" }}
          >
            {toggleDialog?.active ? "Ukryj osiągnięcie" : "Aktywuj osiągnięcie"}
          </Button>
        </AppDialogFooter>
      </AppDialog>

      <Snackbar
        open={snackbar != null}
        autoHideDuration={4500}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar?.severity}
          variant="filled"
          onClose={() => setSnackbar(null)}
          sx={{ width: "100%" }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}