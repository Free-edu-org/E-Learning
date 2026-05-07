import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CheckCircleOutlined as CorrectIcon,
  CancelOutlined as IncorrectIcon,
  TrendingUpOutlined as ResultIcon,
  ArrowBackOutlined as BackIcon,
} from "@mui/icons-material";
import type { SubmitAnswersResponse } from "@/api/studentService";
import {
  AppDialog,
  AppDialogHeader,
  AppDialogBody,
  AppDialogFooter,
} from "@/components/ui/dialog/AppDialog";
import { panelSurfaceSx } from "@/components/ui/panel/panelStyles";
import { formatRatioPercent } from "@/utils/dashboardUtils";

interface LessonResultDialogProps {
  open: boolean;
  result: SubmitAnswersResponse | null;
  onBackToDashboard: () => void;
  onOpenDetails: () => void;
}

export function LessonResultDialog({
  open,
  result,
  onBackToDashboard,
  onOpenDetails,
}: LessonResultDialogProps) {
  const theme = useTheme();

  if (!result) return null;

  const correctCount = result.details.filter((d) => d.isCorrect).length;
  const incorrectCount = result.details.length - correctCount;

  return (
    <AppDialog
      open={open}
      onClose={() => undefined}
      maxWidth="xs"
      backdropSx={{
        backgroundColor: alpha("#0f172a", theme.palette.mode === "dark" ? 0.56 : 0.34),
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <AppDialogHeader
        icon={<ResultIcon />}
        title="Wynik lekcji"
        subtitle="Lekcja została zakończona. Wybierz kolejny krok, aby przejść dalej."
      />

      <AppDialogBody>
        <Box
          sx={{
            ...panelSurfaceSx,
            p: 3,
            textAlign: "center",
            bgcolor: alpha(theme.palette.success.main, 0.07),
            mb: 2.5,
          }}
        >
          <Typography variant="h3" fontWeight={800} color="success.main">
            {formatRatioPercent(result.score, result.maxScore)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {result.score} / {result.maxScore} punktów
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              textAlign: "center",
              bgcolor: alpha(theme.palette.success.main, 0.08),
              border: "1px solid",
              borderColor: alpha(theme.palette.success.main, 0.2),
            }}
          >
            <Typography variant="h5" fontWeight={700} color="success.main">
              {correctCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              poprawnych
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              textAlign: "center",
              bgcolor: alpha(theme.palette.error.main, 0.08),
              border: "1px solid",
              borderColor: alpha(theme.palette.error.main, 0.2),
            }}
          >
            <Typography variant="h5" fontWeight={700} color="error.main">
              {incorrectCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              niepoprawnych
            </Typography>
          </Box>
        </Stack>

        {/* Per-task result list */}
        <Stack spacing={0.75}>
          {result.details.map((detail, index) => (
            <Stack
              key={index}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: (t) =>
                  alpha(
                    detail.isCorrect
                      ? t.palette.success.main
                      : t.palette.error.main,
                    0.06,
                  ),
              }}
            >
              {detail.isCorrect ? (
                <CorrectIcon color="success" fontSize="small" />
              ) : (
                <IncorrectIcon color="error" fontSize="small" />
              )}
              <Typography variant="body2" fontWeight={500}>
                Zadanie {index + 1}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </AppDialogBody>

      <AppDialogFooter>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={onBackToDashboard}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: "none",
          }}
        >
          Wróć do panelu
        </Button>
        <Button
          variant="outlined"
          onClick={onOpenDetails}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Szczegóły
        </Button>
      </AppDialogFooter>
    </AppDialog>
  );
}
