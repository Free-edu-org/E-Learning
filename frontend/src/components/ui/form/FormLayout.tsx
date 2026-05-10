import {
  Box,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";
import { uiTokens } from "@/theme/uiTokens";

export function FormField({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: uiTokens.form.fieldGap,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

type FormSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function FormSection({
  title,
  description,
  children,
  sx,
}: FormSectionProps) {
  return (
    <Box
      sx={[
        {
          display: "grid",
          gap: 2.25,
          px: { xs: 2.25, sm: 2.75 },
          py: { xs: 2.25, sm: 2.75 },
          borderRadius: uiTokens.radius.section,
          bgcolor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.78)"
              : "rgba(255, 255, 255, 0.03)",
          border: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(148, 163, 184, 0.14)"
              : "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(14px)",
          boxShadow: (theme) =>
            theme.palette.mode === "light"
              ? "0 16px 32px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.6)"
              : "0 12px 24px rgba(0, 0, 0, 0.18)",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {(title || description) && (
        <Box>
          {title && (
            <Typography
              variant="subtitle1"
              fontWeight={700}
              fontSize="0.95rem"
              letterSpacing="-0.01em"
              sx={{ color: "text.primary" }}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, lineHeight: 1.6 }}
            >
              {description}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}

export function FormActions({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack
      direction="row"
      spacing={uiTokens.form.actionGap}
      justifyContent="flex-end"
      alignItems="center"
      sx={{ width: "100%", flexWrap: "wrap", rowGap: 1, ...sx }}
    >
      {children}
    </Stack>
  );
}
