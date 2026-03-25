import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Switch,
  Chip,
  Button,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  EditOutlined as EditIcon,
  BarChartOutlined as BarChartIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import type { Lesson } from "@/api/lessonService";

interface LessonCardProps {
  lesson: Lesson;
  /** When true, renders a compact horizontal row instead of the full card */
  listView?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/** Small colored dot for list-view status indicator */
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

/**
 * Renders up to MAX_CHIPS_VISIBLE group chips.
 * If there are more, shows "+N inne" chip with a tooltip listing the rest.
 */
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
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {visible.map((g) => (
        <Chip
          key={g.id}
          label={g.name}
          size="small"
          variant="outlined"
          sx={{
            fontSize: "0.68rem",
            height: 20,
            borderRadius: "6px",
            color: "text.secondary",
            borderColor: "divider",
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
              borderRadius: "6px",
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

export function LessonCard({ lesson, listView = false }: LessonCardProps) {
  if (listView) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.25,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          transition: "box-shadow 0.15s, border-color 0.15s",
          "&:hover": { boxShadow: 2, borderColor: "primary.light" },
        }}
      >
        {/* Status dot */}
        <StatusDot active={lesson.isActive} />

        {/* Title + theme */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            color="primary.main"
            noWrap
          >
            {lesson.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {lesson.theme}
          </Typography>
        </Box>

        {/* Groups (compact list) */}
        <Box
          sx={{
            flexShrink: 0,
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 0.5,
            maxWidth: 220,
          }}
        >
          <GroupChips groups={lesson.groups} />
        </Box>

        {/* Date */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0, display: { xs: "none", sm: "block" } }}
        >
          {formatDate(lesson.createdAt)}
        </Typography>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          <Button
            size="small"
            startIcon={<EditIcon fontSize="small" />}
            sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
          >
            Edytuj
          </Button>
          <Button
            size="small"
            startIcon={<BarChartIcon fontSize="small" />}
            sx={{ textTransform: "none", fontWeight: 600, minWidth: 0 }}
          >
            Wyniki
          </Button>
        </Box>
      </Box>
    );
  }

  // ── Grid card view ──
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "box-shadow 0.2s, transform 0.15s",
        "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Title */}
        <Box
          sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}
        >
          <BookIcon
            sx={{ color: "primary.main", fontSize: 18, mt: 0.3, flexShrink: 0 }}
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

        {/* Theme */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5, ml: "26px" }}
        >
          {lesson.theme}
        </Typography>

        {/* Status */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Status:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {lesson.isActive ? (
              <Chip
                label="Aktywna"
                size="small"
                sx={{
                  bgcolor: "#1a1a2e",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            ) : (
              <Chip
                label="Nieaktywna"
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }}
              />
            )}
            <Switch
              size="small"
              checked={lesson.isActive}
              readOnly
              sx={{ pointerEvents: "none" }}
            />
          </Box>
        </Box>

        {/* Created at */}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 1 }}
        >
          Utworzona: {formatDate(lesson.createdAt)}
        </Typography>

        {/* Groups */}
        <GroupChips groups={lesson.groups} />
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon fontSize="small" />}
          fullWidth
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Edytuj
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<BarChartIcon fontSize="small" />}
          fullWidth
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Wyniki
        </Button>
      </CardActions>
    </Card>
  );
}
