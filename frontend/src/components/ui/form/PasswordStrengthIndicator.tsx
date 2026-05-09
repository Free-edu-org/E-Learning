import { Box, Typography } from "@mui/material";
import { getPasswordStrength } from "@/utils/passwordStrength";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <Box sx={{ mb: 1, mt: 0.75 }}>
      <Box
        sx={{
          height: 4,
          bgcolor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${strength.score}%`,
            bgcolor: strength.color,
            transition: "width 0.3s, background-color 0.3s",
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        Siła hasła: {strength.label}
      </Typography>
    </Box>
  );
}
