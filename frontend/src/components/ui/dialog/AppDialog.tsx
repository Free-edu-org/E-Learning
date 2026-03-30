import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { uiTokens } from "@/theme/uiTokens";

type AppDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md";
  paperSx?: SxProps<Theme>;
};

const dialogPaperSx: SxProps<Theme> = {
  borderRadius: uiTokens.radius.dialog,
  overflow: "hidden",
  border: "1px solid",
  borderColor: (theme) => alpha(theme.palette.divider, 0.75),
  bgcolor: "background.paper",
  backgroundImage: (theme) =>
    theme.palette.mode === "dark"
      ? `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.018)} 0%, transparent 18%)`
      : "none",
  boxShadow: "0 24px 64px rgba(15, 23, 42, 0.24)",
};

const dialogHeaderSx: SxProps<Theme> = {
  px: uiTokens.modal.headerPaddingX,
  py: uiTokens.modal.headerPaddingY,
  bgcolor: "transparent",
};

const dialogBodySx: SxProps<Theme> = {
  px: uiTokens.modal.bodyPaddingX,
  pt: uiTokens.modal.bodyPaddingTop,
  pb: uiTokens.modal.bodyPaddingBottom,
  "& .MuiFormControl-root": {
    width: "100%",
  },
  "& .MuiOutlinedInput-root": {
    minHeight: uiTokens.control.minHeight,
    borderRadius: uiTokens.radius.control,
    bgcolor: (theme) => alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.02 : 0.58),
  },
  "& .MuiInputBase-input": {
    py: 1.375,
  },
  "& .MuiInputBase-inputMultiline": {
    py: 0,
  },
  "& .MuiFormHelperText-root": {
    mt: 0.75,
    ml: 0.25,
    mr: 0,
  },
};

const dialogFooterSx: SxProps<Theme> = {
  px: uiTokens.modal.footerPaddingX,
  pt: uiTokens.modal.footerPaddingTop,
  pb: uiTokens.modal.footerPaddingBottom,
  background: (theme) =>
    `linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.025 : 0.015)} 100%)`,
  boxShadow: (theme) => `inset 0 1px 0 ${alpha(theme.palette.divider, 0.22)}`,
};

export function AppDialog({
  open,
  onClose,
  children,
  maxWidth = "sm",
  paperSx,
}: AppDialogProps) {
  const resolvedPaperSx = (paperSx ? [dialogPaperSx, paperSx] : dialogPaperSx) as SxProps<Theme>;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{ sx: resolvedPaperSx }}
    >
      {children}
    </Dialog>
  );
}

type AppDialogHeaderProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
};

export function AppDialogHeader({
  icon,
  title,
  subtitle,
  badge,
}: AppDialogHeaderProps) {
  return (
    <DialogTitle sx={dialogHeaderSx}>
      <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "primary.main",
              bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.1),
              boxShadow: (theme) => `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.05)}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.45 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {badge && (
          <Box sx={{ pt: 0.375, pl: 1, flexShrink: 0 }}>
            {badge}
          </Box>
        )}
      </Stack>
    </DialogTitle>
  );
}

export function AppDialogBody({ children }: { children: ReactNode }) {
  return <DialogContent sx={dialogBodySx}>{children}</DialogContent>;
}

export function AppDialogFooter({ children }: { children: ReactNode }) {
  return <DialogActions sx={dialogFooterSx}>{children}</DialogActions>;
}
