import { Paper, Typography, Box } from "@mui/material";
import {
  panelSurfaceActionSx,
  panelSurfaceSx,
} from "@/components/ui/panel/panelStyles";

interface ActionButtonProps {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

export function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
}: ActionButtonProps) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={[panelSurfaceSx as any, panelSurfaceActionSx as any, { flex: 1 }]}
    >
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
