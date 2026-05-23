import { ButtonBase, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import {
  LESSON_LABEL_COLOR_OPTIONS,
  getLessonLabelColorOption,
} from "@/constants/lessonLabelColors";
import type { LessonLabelColor } from "@/constants/lessonLabelColors";

interface LessonLabelColorPickerProps {
  value: LessonLabelColor | null;
  onChange: (color: LessonLabelColor | null) => void;
  disabled?: boolean;
}

const colorButtonSx = (color: string, selected: boolean): SxProps<Theme> => ({
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "1px solid",
  borderColor: (theme) =>
    selected
      ? alpha(theme.palette.primary.main, 0.7)
      : alpha(theme.palette.text.primary, 0.12),
  bgcolor: (theme) =>
    selected
      ? alpha(
          theme.palette.primary.main,
          theme.palette.mode === "light" ? 0.1 : 0.18,
        )
      : "transparent",
  boxShadow: selected
    ? (theme: Theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`
    : "none",
  transition:
    "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    bgcolor: (theme: Theme) =>
      selected
        ? alpha(
            theme.palette.primary.main,
            theme.palette.mode === "light" ? 0.12 : 0.2,
          )
        : alpha(theme.palette.text.primary, 0.04),
  },
  "&:focus-visible": {
    outline: "none",
    boxShadow: (theme: Theme) =>
      `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
  },
  "&::after": {
    content: '""',
    width: 18,
    height: 18,
    borderRadius: "50%",
    bgcolor: color,
    border: "1px solid",
    borderColor: (theme: Theme) => alpha(theme.palette.common.white, 0.78),
    boxShadow: (theme: Theme) =>
      `0 0 0 1px ${alpha(theme.palette.text.primary, 0.14)}, 0 2px 7px ${alpha(color, 0.3)}`,
  },
});

export function LessonLabelColorPicker({
  value,
  onChange,
  disabled = false,
}: LessonLabelColorPickerProps) {
  const selectedOption = getLessonLabelColorOption(value);

  return (
    <Stack spacing={1.1}>
      <Stack
        direction="row"
        spacing={0.85}
        flexWrap="wrap"
        useFlexGap
        role="radiogroup"
        aria-label="Kolor organizacyjny lekcji"
      >
        <ButtonBase
          component="button"
          type="button"
          disabled={disabled}
          role="radio"
          aria-checked={value == null}
          onClick={() => onChange(null)}
          sx={{
            minHeight: 38,
            px: 1.35,
            borderRadius: 999,
            border: "1px solid",
            borderColor: (theme) =>
              value == null
                ? alpha(theme.palette.primary.main, 0.48)
                : alpha(theme.palette.text.primary, 0.12),
            bgcolor: (theme) =>
              value == null
                ? alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "light" ? 0.08 : 0.14,
                  )
                : "transparent",
            color: value == null ? "text.primary" : "text.secondary",
            fontWeight: 800,
            fontSize: "0.78rem",
            transition:
              "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease",
            "&:hover": {
              bgcolor: (theme) =>
                alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === "light" ? 0.09 : 0.16,
                ),
            },
            "&:focus-visible": {
              outline: "none",
              boxShadow: (theme) =>
                `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
            },
          }}
        >
          Brak koloru
        </ButtonBase>

        {LESSON_LABEL_COLOR_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <Tooltip key={option.value} title={option.label} arrow>
              <ButtonBase
                component="button"
                type="button"
                disabled={disabled}
                role="radio"
                aria-label={`Kolor lekcji: ${option.label}`}
                aria-checked={selected}
                onClick={() => onChange(option.value)}
                sx={colorButtonSx(option.color, selected)}
              />
            </Tooltip>
          );
        })}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {selectedOption
          ? `Wybrano: ${selectedOption.label}. Kolor jest widoczny na kartach lekcji i w filtrach.`
          : "Bez koloru lekcja będzie działać tak jak dotychczas."}
      </Typography>
    </Stack>
  );
}
