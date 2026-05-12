import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import type { DialogProps } from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import { CloseOutlined as CloseIcon } from "@mui/icons-material";
import { createContext, type ReactNode, useContext } from "react";
import { uiTokens } from "@/theme/uiTokens";

const AppDialogContext = createContext<{ onClose: () => void } | null>(null);

type AppDialogProps = {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md";
  paperSx?: SxProps<Theme>;
  backdropSx?: SxProps<Theme>;
  PaperProps?: DialogProps["PaperProps"];
};

const dialogPaperSx: SxProps<Theme> = {
  borderRadius: uiTokens.radius.dialog,
  overflow: "hidden",
  border: "1px solid",
  borderColor: (theme) =>
    theme.palette.mode === "light"
      ? "rgba(15, 23, 42, 0.06)"
      : "rgba(255, 255, 255, 0.08)",
  bgcolor: "background.paper",
  backgroundImage: (theme) =>
    theme.palette.mode === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,249,255,0.98) 100%)"
      : "linear-gradient(180deg, rgba(20,24,34,0.94) 0%, rgba(16,18,27,0.98) 100%)",
  backdropFilter: "blur(26px)",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 34px 80px rgba(15, 23, 42, 0.16), 0 12px 30px rgba(76, 92, 149, 0.1), inset 0 1px 0 rgba(255,255,255,0.88)"
      : "0 28px 80px rgba(0, 0, 0, 0.54), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const dialogHeaderSx: SxProps<Theme> = {
  px: uiTokens.modal.headerPaddingX,
  py: uiTokens.modal.headerPaddingY,
  bgcolor: "transparent",
  position: "relative",
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
    bgcolor: (theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.common.white, 0.94)
        : alpha(theme.palette.background.paper, 0.84),
    boxShadow: (theme) =>
      theme.palette.mode === "light"
        ? "inset 0 1px 1px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03)"
        : "inset 0 1px 1px rgba(255,255,255,0.04)",
    transition:
      "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease",
    "& fieldset": {
      borderColor: (theme) => alpha(theme.palette.text.primary, 0.1),
    },
    "&:hover": {
      bgcolor: (theme) =>
        theme.palette.mode === "light"
          ? theme.palette.common.white
          : alpha(theme.palette.background.paper, 0.92),
      "& fieldset": {
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.26),
      },
    },
    "&.Mui-focused": {
      transform: "translateY(-1px)",
      boxShadow: (theme) =>
        `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}, 0 12px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
      "& fieldset": {
        borderColor: "primary.main",
        borderWidth: 1,
      },
    },
  },
  "& .MuiInputBase-input": {
    py: 1.625,
    fontSize: "0.97rem",
  },
  "& .MuiInputBase-inputMultiline": {
    py: 0,
  },
  "& .MuiInputBase-input::placeholder": {
    color: "text.secondary",
    opacity: 0.72,
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
    fontSize: 20,
  },
  "& .MuiSelect-icon": {
    right: 14,
    color: "text.secondary",
    transition: "transform 0.2s ease, color 0.2s ease",
  },
  "& .Mui-focused .MuiSelect-icon": {
    color: "primary.main",
  },
  "& .MuiFormHelperText-root": {
    mt: 1,
    ml: 0.5,
    mr: 0,
    fontSize: "0.77rem",
    lineHeight: 1.45,
  },
  "& .MuiFormLabel-root": {
    fontWeight: 600,
  },
};

const dialogFooterSx: SxProps<Theme> = {
  px: uiTokens.modal.footerPaddingX,
  pt: uiTokens.modal.footerPaddingTop,
  pb: uiTokens.modal.footerPaddingBottom,
  borderTop: "1px solid",
  borderColor: (theme) => alpha(theme.palette.text.primary, 0.08),
  bgcolor: (theme) =>
    theme.palette.mode === "light"
      ? "rgba(255, 255, 255, 0.48)"
      : "rgba(255, 255, 255, 0.02)",
  backdropFilter: "blur(18px)",
  gap: 1.25,
  "& .MuiButton-root": {
    minHeight: 50,
    borderRadius: 999,
    px: 2.4,
    fontWeight: 700,
    letterSpacing: "0.01em",
    textTransform: "none",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease",
  },
  "& .MuiButton-root:hover": {
    transform: "translateY(-1px)",
  },
  "& .MuiButton-text": {
    color: "text.primary",
    bgcolor: (theme) => alpha(theme.palette.common.white, 0.62),
    border: "1px solid",
    borderColor: (theme) => alpha(theme.palette.text.primary, 0.08),
    boxShadow: (theme) =>
      theme.palette.mode === "light"
        ? "0 8px 18px rgba(15, 23, 42, 0.06)"
        : "none",
    "&:hover": {
      bgcolor: (theme) => alpha(theme.palette.common.white, 0.9),
      borderColor: (theme) => alpha(theme.palette.text.primary, 0.12),
    },
  },
  "& .MuiButton-contained": {
    color: "common.white",
    backgroundImage:
      "linear-gradient(135deg, #6d5dfc 0%, #3b82f6 55%, #22c1ff 100%)",
    boxShadow: "0 16px 30px rgba(73, 87, 255, 0.28)",
    "&:hover": {
      backgroundImage:
        "linear-gradient(135deg, #5f52f4 0%, #3579f0 55%, #16b6ff 100%)",
      boxShadow: "0 20px 36px rgba(73, 87, 255, 0.34)",
    },
  },
};

export function AppDialog({
  open,
  onClose,
  onExited,
  children,
  maxWidth = "sm",
  paperSx,
  backdropSx,
  PaperProps = {},
}: AppDialogProps) {
  const resolvedPaperSx = (
    paperSx ? [dialogPaperSx, paperSx] : dialogPaperSx
  ) as SxProps<Theme>;

  return (
    <AppDialogContext.Provider value={{ onClose }}>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={maxWidth}
        slotProps={{
          backdrop: {
            sx: [
              {
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(10, 14, 24, 0.34)",
              },
              ...(Array.isArray(backdropSx)
                ? backdropSx
                : backdropSx
                  ? [backdropSx]
                  : []),
            ] as SxProps<Theme>,
          },
        }}
        PaperProps={{
          ...PaperProps,
          sx: [
            ...(Array.isArray(resolvedPaperSx)
              ? resolvedPaperSx
              : [resolvedPaperSx]),
            ...(Array.isArray(PaperProps.sx)
              ? PaperProps.sx
              : PaperProps.sx
                ? [PaperProps.sx]
                : []),
          ] as SxProps<Theme>,
        }}
        TransitionProps={{ onExited }}
      >
        {children}
      </Dialog>
    </AppDialogContext.Provider>
  );
}

type AppDialogHeaderProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  hideCloseButton?: boolean;
  iconContainerSx?: SxProps<Theme>;
};

export function AppDialogHeader({
  icon,
  title,
  subtitle,
  badge,
  hideCloseButton = false,
  iconContainerSx,
}: AppDialogHeaderProps) {
  const hasSubtitle = Boolean(subtitle);
  const dialogContext = useContext(AppDialogContext);

  return (
    <DialogTitle sx={dialogHeaderSx}>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems={hasSubtitle ? "flex-start" : "center"}
          sx={{ minWidth: 0, flex: 1 }}
        >
          <Box
            sx={[
              {
                width: 58,
                height: 58,
                borderRadius: 3.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "common.white",
                backgroundImage:
                  "linear-gradient(135deg, #7c6cff 0%, #4f8cff 55%, #2bc8ff 100%)",
                boxShadow: (theme) =>
                  `0 18px 32px ${alpha(theme.palette.primary.main, 0.26)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.34)}`,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: -8,
                  borderRadius: "inherit",
                  background: (theme) =>
                    `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 72%)`,
                  zIndex: -1,
                },
                position: "relative",
                "& .MuiSvgIcon-root": {
                  fontSize: 28,
                },
              },
              ...(Array.isArray(iconContainerSx)
                ? iconContainerSx
                : iconContainerSx
                  ? [iconContainerSx]
                  : []),
            ]}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ lineHeight: 1.08, letterSpacing: "-0.02em" }}
            >
              {title}
            </Typography>
            {hasSubtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, maxWidth: 420, lineHeight: 1.6 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ pl: 1, flexShrink: 0 }}
        >
          {badge && <Box>{badge}</Box>}
          {!hideCloseButton && dialogContext && (
            <IconButton
              aria-label="Zamknij okno"
              onClick={dialogContext.onClose}
              sx={{
                width: 42,
                height: 42,
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.text.primary, 0.16),
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? alpha(theme.palette.common.white, 0.95)
                    : alpha(theme.palette.background.paper, 0.8),
                color: "text.primary",
                boxShadow: (theme) =>
                  theme.palette.mode === "light"
                    ? "0 10px 24px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.8)"
                    : "0 10px 24px rgba(0, 0, 0, 0.24)",
                transition:
                  "transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
                "&:hover": {
                  transform: "translateY(-1px) scale(1.05)",
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? theme.palette.common.white
                      : alpha(theme.palette.background.paper, 0.95),
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.4),
                  color: "primary.main",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </DialogTitle>
  );
}

export function AppDialogBody({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <DialogContent
      sx={[dialogBodySx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {children}
    </DialogContent>
  );
}

export function AppDialogFooter({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <DialogActions
      sx={[dialogFooterSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {children}
    </DialogActions>
  );
}

type AppDialogStatusProps = {
  severity: "success" | "error" | "info" | "warning";
  children: ReactNode;
};

export function AppDialogStatus({ severity, children }: AppDialogStatusProps) {
  return (
    <Alert
      severity={severity}
      sx={{
        mb: 2.75,
        borderRadius: 3.5,
        alignItems: "flex-start",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette[severity].main, 0.14),
        backgroundColor: (theme) => alpha(theme.palette[severity].main, 0.08),
        "& .MuiAlert-message": {
          width: "100%",
        },
      }}
    >
      {children}
    </Alert>
  );
}
