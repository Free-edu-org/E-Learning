import { Paper, Typography } from "@mui/material";

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
        p: 2.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
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
