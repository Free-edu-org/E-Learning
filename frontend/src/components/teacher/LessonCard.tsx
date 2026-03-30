import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  BarChartOutlined as BarChartIcon,
  EditOutlined as EditIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import type { Lesson } from "@/api/lessonService";
import {
  outlinedMetaChipSx,
  panelCardFooterSx,
  panelFooterButtonSx,
  panelGridCardContentSx,
  panelGridCardSx,
  panelListRowSx,
} from "@/components/ui/panel/panelStyles";

interface LessonCardProps {
  lesson: Lesson;
  listView?: boolean;
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
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {visible.map((g) => (
        <Chip
          key={g.id}
          label={g.name}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.68rem", height: 20, ...outlinedMetaChipSx }}
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

export function LessonCard({ lesson, listView = false }: LessonCardProps) {
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

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0, display: { xs: "none", sm: "block" } }}
        >
          {formatDate(lesson.createdAt)}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          <Button
            size="small"
            startIcon={<EditIcon fontSize="small" />}
            sx={{ ...panelFooterButtonSx, color: "primary.main" }}
          >
            Edytuj
          </Button>
          <Button
            size="small"
            startIcon={<BarChartIcon fontSize="small" />}
            sx={{ ...panelFooterButtonSx, color: "primary.main" }}
          >
            Wyniki
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{ ...panelGridCardSx, display: "flex", flexDirection: "column" }}
    >
      <CardContent
        sx={{
          ...panelGridCardContentSx,
          flex: "1 1 auto",
          height: "auto",
          pb: 1,
        }}
      >
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

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5, ml: "26px" }}
        >
          {lesson.theme}
        </Typography>

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

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 1 }}
        >
          Utworzono: {formatDate(lesson.createdAt)}
        </Typography>

        <GroupChips groups={lesson.groups} />
      </CardContent>

      <Divider />

      <CardActions sx={{ ...panelCardFooterSx, px: 2, py: 1, gap: 1, mt: 0 }}>
        <Box
          sx={{ display: "flex", width: "100%", gap: 1, flexWrap: "nowrap" }}
        >
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<EditIcon fontSize="small" />}
            fullWidth
            sx={panelFooterButtonSx}
          >
            Edytuj
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<BarChartIcon fontSize="small" />}
            fullWidth
            sx={panelFooterButtonSx}
          >
            Wyniki
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
