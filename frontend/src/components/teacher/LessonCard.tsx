import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import {
  BarChart as BarChartIcon,
  CalendarMonthOutlined as CalendarIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  GroupsOutlined as GroupsIcon,
} from "@mui/icons-material";
import type { Lesson } from "@/api/lessonService";
import {
  panelCardFooterSx,
  panelFooterButtonsSx,
  panelFooterButtonSx,
  panelGridCardContentSx,
  panelGridCardSx,
  panelListRowSx,
} from "@/components/ui/panel/panelStyles";

interface LessonCardProps {
  lesson: Lesson;
  listView?: boolean;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  onResults?: (lesson: Lesson) => void;
  onToggleStatus?: (lesson: Lesson) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: active ? "success.main" : "text.disabled",
        flexShrink: 0,
      }}
    />
  );
}

const MAX_CHIPS_VISIBLE = 2;

function GroupChips({ groups }: { groups: Lesson["groups"] }) {
  if (groups.length === 0) {
    return (
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontStyle: "italic" }}
      >
        Brak grup
      </Typography>
    );
  }

  const visible = groups.slice(0, MAX_CHIPS_VISIBLE);
  const overflow = groups.slice(MAX_CHIPS_VISIBLE);

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        minWidth: 0,
      }}
    >
      {visible.map((g) => (
        <Chip
          key={g.publicId}
          label={g.name}
          size="small"
          sx={{
            height: 26,
            borderRadius: 999,
            maxWidth: "100%",
            fontSize: "0.72rem",
            fontWeight: 700,
            bgcolor: (theme: Theme) =>
              theme.palette.mode === "light"
                ? alpha(theme.palette.primary.main, 0.07)
                : alpha(theme.palette.primary.light, 0.1),
            color: (theme: Theme) =>
              theme.palette.mode === "light"
                ? theme.palette.primary.dark
                : alpha(theme.palette.primary.light, 0.92),
            border: "1px solid",
            borderColor: (theme: Theme) =>
              theme.palette.mode === "light"
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.light, 0.14),
            "& .MuiChip-label": {
              px: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
      ))}
      {overflow.length > 0 && (
        <Tooltip
          title={overflow.map((g) => g.name).join(", ")}
          arrow
          placement="top"
        >
          <Chip
            label={`+${overflow.length} ${overflow.length === 1 ? "inna" : "inne"}`}
            size="small"
            sx={{
              fontSize: "0.68rem",
              height: 20,
              borderRadius: "999px",
              bgcolor: "action.hover",
              color: "text.secondary",
              cursor: "default",
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}

const lessonActionButtonSx: SxProps<Theme> = {
  justifyContent: "center",
  px: 0.95,
  minHeight: 30,
  width: "auto",
  flex: "0 0 auto",
  borderRadius: 999,
  color: "text.secondary",
  fontWeight: 600,
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.06)
      : alpha(theme.palette.common.white, 0.045),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.white, 0.54)
      : alpha(theme.palette.common.white, 0.024),
  boxShadow: (theme: Theme) =>
    theme.palette.mode === "light"
      ? "inset 0 1px 0 rgba(255,255,255,0.58)"
      : "inset 0 1px 0 rgba(255,255,255,0.02)",
  whiteSpace: "nowrap",
  transition:
    "background-color 0.22s ease, border-color 0.22s ease, color 0.22s ease, transform 0.22s ease",
  "&:hover": {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.common.white, 0.74)
        : alpha(theme.palette.common.white, 0.04),
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.primary, 0.1)
        : alpha(theme.palette.common.white, 0.08),
    color: "text.primary",
    transform: "translateY(-1px)",
  },
};

const lessonDeleteButtonSx: SxProps<Theme> = {
  color: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.dark, 0.68)
      : alpha(theme.palette.error.light, 0.7),
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.main, 0.08)
      : alpha(theme.palette.error.light, 0.08),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.error.main, 0.024)
      : alpha(theme.palette.error.light, 0.04),
  "&:hover": {
    color: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.dark, 0.84)
        : alpha(theme.palette.error.light, 0.82),
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.main, 0.14)
        : alpha(theme.palette.error.light, 0.12),
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.error.main, 0.05)
        : alpha(theme.palette.error.light, 0.06),
    transform: "translateY(-1px)",
  },
};

const lessonCardSurfaceSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "hidden",
  minHeight: 196,
  backgroundImage: (theme: Theme) =>
    theme.palette.mode === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,251,255,0.985) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.042) 0%, rgba(255,255,255,0.016) 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: (theme: Theme) =>
      theme.palette.mode === "light"
        ? "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 20%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.026) 0%, rgba(255,255,255,0) 22%)",
    pointerEvents: "none",
  },
};

const lessonCardContentSx: SxProps<Theme> = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
  px: 2,
  pt: 1.7,
  pb: 1.05,
};

const lessonCardFooterSx: SxProps<Theme> = {
  position: "relative",
  zIndex: 1,
  px: 2,
  py: 1.1,
  mt: 0,
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.06)
      : alpha(theme.palette.common.white, 0.05),
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha("#f8faff", 0.78)
      : alpha(theme.palette.common.white, 0.012),
  backdropFilter: "blur(8px)",
};

const lessonCardActionsWrapSx: SxProps<Theme> = {
  gap: 0.65,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  width: "100%",
};

const lessonMetaRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 0.55,
  color: "text.secondary",
  fontSize: "0.77rem",
  lineHeight: 1.45,
};

const getLessonSwitchSx = (active: boolean): SxProps<Theme> => ({
  mr: 0.25,
  "& .MuiSwitch-switchBase": {
    p: 0.5,
    color: active ? "success.main" : "error.main",
  },
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "success.main",
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "none",
  },
  "& .MuiSwitch-track": {
    borderRadius: 999,
    opacity: 1,
    backgroundColor: (theme: Theme) => alpha(theme.palette.error.main, 0.35),
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: (theme: Theme) => alpha(theme.palette.success.main, 0.35),
  },
});

export function LessonCard({
  lesson,
  listView = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onResults,
}: LessonCardProps) {
  if (listView) {
    return (
      <Box
        sx={{
          ...panelListRowSx,
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.25,
          transition: "box-shadow 0.15s, border-color 0.15s",
          "&:hover": { boxShadow: 2, borderColor: "primary.light" },
        }}
      >
        <StatusDot active={lesson.isActive} />

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              color="primary.main"
              sx={{ overflowWrap: "anywhere" }}
            >
              {lesson.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ overflowWrap: "anywhere" }}
            >
              {lesson.theme}
            </Typography>
            <Box
              sx={{
                mt: 0.6,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.55,
                minWidth: 0,
              }}
            >
              <GroupChips groups={lesson.groups} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.2 }}
              >
                Data utworzenia: {formatDate(lesson.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            flexShrink: 0,
            alignItems: "center",
            ml: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip
            title={lesson.isActive ? "Dezaktywuj lekcję" : "Aktywuj lekcję"}
            placement="top"
          >
            <Switch
              size="small"
              checked={lesson.isActive}
              onChange={() => onToggleStatus?.(lesson)}
              sx={getLessonSwitchSx(lesson.isActive)}
            />
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon fontSize="small" />}
            sx={[panelFooterButtonSx as object, lessonActionButtonSx]}
            onClick={() => onEdit?.(lesson)}
          >
            Edytuj
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<BarChartIcon fontSize="small" />}
            sx={[panelFooterButtonSx as object, lessonActionButtonSx]}
            onClick={() => onResults?.(lesson)}
          >
            Wyniki
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon fontSize="small" />}
            sx={[
              panelFooterButtonSx as object,
              lessonActionButtonSx,
              lessonDeleteButtonSx,
            ]}
            onClick={() => onDelete?.(lesson)}
          >
            Usuń
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Card elevation={0} sx={[panelGridCardSx as object, lessonCardSurfaceSx]}>
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          flex: 1,
        }}
      >
        <CardContent
          sx={[panelGridCardContentSx as object, lessonCardContentSx]}
        >
          <Stack spacing={1.35} sx={{ flex: 1, minHeight: 0 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={1.25}
              alignItems="flex-start"
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{ lineHeight: 1.3, overflowWrap: "anywhere" }}
                >
                  {lesson.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.65, lineHeight: 1.55, overflowWrap: "anywhere" }}
                >
                  {lesson.theme}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={lesson.isActive ? "Aktywna" : "Nieaktywna"}
                color={lesson.isActive ? "success" : "default"}
                variant={lesson.isActive ? "filled" : "outlined"}
                sx={{
                  flexShrink: 0,
                  height: 28,
                  borderRadius: 999,
                  fontWeight: 700,
                  "& .MuiChip-label": { px: 1.1 },
                }}
              />
            </Stack>

            <Box sx={{ minWidth: 0 }}>
              <GroupChips groups={lesson.groups} />
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }} />

            <Stack spacing={0.8} sx={{ pt: 0.15 }}>
              <Box sx={lessonMetaRowSx}>
                <CalendarIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" color="inherit">
                  Utworzono {formatDate(lesson.createdAt)}
                </Typography>
              </Box>
              <Box sx={lessonMetaRowSx}>
                <GroupsIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" color="inherit">
                  {lesson.groups.length === 0
                    ? "Brak przypisanych grup"
                    : lesson.groups.length === 1
                      ? "1 przypisana grupa"
                      : `${lesson.groups.length} przypisane grupy`}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  pt: 0.25,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <StatusDot active={lesson.isActive} />
                  <Typography variant="caption" color="text.secondary">
                    {lesson.isActive
                      ? "Widoczna dla uczniów"
                      : "Ukryta przed uczniami"}
                  </Typography>
                </Stack>
                <Switch
                  size="small"
                  checked={lesson.isActive}
                  onChange={() => onToggleStatus?.(lesson)}
                  sx={getLessonSwitchSx(lesson.isActive)}
                />
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Box>

      <CardActions
        sx={[panelCardFooterSx as object, lessonCardFooterSx]}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={[panelFooterButtonsSx as object, lessonCardActionsWrapSx]}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon fontSize="small" />}
            sx={[panelFooterButtonSx as object, lessonActionButtonSx]}
            onClick={() => onEdit?.(lesson)}
          >
            Edytuj
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<BarChartIcon fontSize="small" />}
            sx={[panelFooterButtonSx as object, lessonActionButtonSx]}
            onClick={() => onResults?.(lesson)}
          >
            Wyniki
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon fontSize="small" />}
            sx={[
              panelFooterButtonSx as object,
              lessonActionButtonSx,
              lessonDeleteButtonSx,
            ]}
            onClick={() => onDelete?.(lesson)}
          >
            Usuń
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
