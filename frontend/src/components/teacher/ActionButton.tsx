import { Paper, Typography, Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  panelSurfaceActionSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";

interface ActionButtonProps {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
  sx,
}: ActionButtonProps) {
  const actionTileSx = [
    panelSurfaceSx,
    panelSurfaceActionSx,
    { flex: 1, borderRadius: 3.5 },
    ...(sx ? [sx] : []),
  ] as SxProps<Theme>;

  return (
    <Paper elevation={0} onClick={onClick} sx={actionTileSx}>
      <Box sx={{ color: "primary.main", mb: 0.5 }}>{icon}</Box>
      <Typography variant="body1" fontWeight={700} align="center">
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" align="center">
        {subtitle}
      </Typography>
    </Paper>
  );
}
