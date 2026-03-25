import { Paper, Typography, Box } from "@mui/material";

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
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        transition: "box-shadow 0.2s, border-color 0.2s, transform 0.15s",
        "&:hover": {
          boxShadow: 4,
          borderColor: "primary.main",
          transform: "translateY(-2px)",
        },
      }}
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
