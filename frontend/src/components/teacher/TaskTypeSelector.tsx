import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutline as ChooseIcon,
  EditNoteOutlined as WriteIcon,
  MicNoneOutlined as SpeakIcon,
  ShuffleOutlined as ScatterIcon,
} from "@mui/icons-material";
import type { ReactNode } from "react";
import type { TaskType } from "@/api/taskService";
import { uiTokens } from "@/theme/uiTokens";

interface TaskTypeOption {
  type: TaskType;
  label: string;
  description: string;
  icon: ReactNode;
}

const taskTypeOptions: TaskTypeOption[] = [
  {
    type: "choose",
    label: "Wybór",
    description: "Uczeń wybiera poprawną odpowiedź",
    icon: <ChooseIcon />,
  },
  {
    type: "write",
    label: "Pisanie",
    description: "Uczeń wpisuje odpowiedź",
    icon: <WriteIcon />,
  },
  {
    type: "scatter",
    label: "Rozsypanka",
    description: "Uczeń układa słowa w kolejności",
    icon: <ScatterIcon />,
  },
  {
    type: "speak",
    label: "Mówienie",
    description: "Uczeń wypowiada odpowiedź",
    icon: <SpeakIcon />,
  },
];

interface TaskTypeSelectorProps {
  onSelect: (type: TaskType) => void;
}

export function TaskTypeSelector({ onSelect }: TaskTypeSelectorProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" },
        gap: 1.5,
      }}
    >
      {taskTypeOptions.map((option) => (
        <Box
          key={option.type}
          onClick={() => onSelect(option.type)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(option.type);
            }
          }}
          sx={{
            p: 2,
            borderRadius: uiTokens.radius.card,
            border: "2px dashed",
            borderColor: (theme) =>
              alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.25 : 0.2,
              ),
            bgcolor: (theme) =>
              alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.04 : 0.02,
              ),
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: (theme) =>
                alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === "dark" ? 0.1 : 0.06,
                ),
              transform: "translateY(-2px)",
              boxShadow: "0 8px 24px rgba(79, 70, 229, 0.15)",
            },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          }}
        >
          <Stack spacing={0.75} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main",
                bgcolor: (theme) =>
                  alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.14 : 0.1,
                  ),
              }}
            >
              {option.icon}
            </Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {option.label}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.3 }}
            >
              {option.description}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
