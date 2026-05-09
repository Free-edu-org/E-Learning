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
        gap: 2,
        px: 2.5,
        py: 2,
        borderRadius: uiTokens.radius.section,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: (theme) =>
          theme.palette.mode === "light"
            ? "0 1px 3px rgba(15, 23, 42, 0.05)"
            : "0 1px 3px rgba(0, 0, 0, 0.2)",
      }}
    >
      {(title || description) && (
        <Box>
          {title && (
            <Typography
              variant="subtitle2"
              fontWeight={700}
              fontSize="0.82rem"
              letterSpacing="0.02em"
              sx={{ textTransform: "uppercase", color: "text.secondary" }}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
