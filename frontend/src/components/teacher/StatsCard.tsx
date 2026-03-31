import { Paper, Typography } from "@mui/material";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";

interface StatsCardProps {
  label: string;
  value: string | number;
  highlightColor?: string;
}

export function StatsCard({ label, value, highlightColor }: StatsCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...panelSurfaceSx,
        p: 2.5,
        flex: 1,
        minWidth: 150,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1, fontSize: "0.8rem" }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: highlightColor ?? "text.primary" }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
