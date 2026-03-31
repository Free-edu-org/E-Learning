import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";
import { uiTokens } from "@/theme/uiTokens";

export function FormField({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: uiTokens.form.fieldGap,
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
};

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: uiTokens.radius.section,
        bgcolor: (theme) =>
          alpha(
            theme.palette.common.white,
            theme.palette.mode === "dark" ? 0.015 : 0.38,
          ),
        border: "1px solid",
        borderColor: (theme) =>
          alpha(
            theme.palette.divider,
            theme.palette.mode === "dark" ? 0.22 : 0.32,
          ),
      }}
    >
      {(title || description) && (
        <Box>
          {title && (
            <Typography variant="subtitle2" fontWeight={800}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75 }}
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

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <Stack
      direction="row"
      spacing={uiTokens.form.actionGap}
      justifyContent="flex-end"
      alignItems="center"
      sx={{ width: "100%" }}
    >
      {children}
    </Stack>
  );
}
