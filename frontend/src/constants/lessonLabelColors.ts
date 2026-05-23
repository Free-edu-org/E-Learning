export type LessonLabelColor =
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";

export interface LessonLabelColorOption {
  value: LessonLabelColor;
  label: string;
  color: string;
}

export const LESSON_LABEL_COLOR_OPTIONS: LessonLabelColorOption[] = [
  { value: "gray", label: "Szary", color: "#8e8e93" },
  { value: "red", label: "Czerwony", color: "#ff3b30" },
  { value: "orange", label: "Pomarańczowy", color: "#ff9500" },
  { value: "yellow", label: "Żółty", color: "#ffcc00" },
  { value: "green", label: "Zielony", color: "#34c759" },
  { value: "blue", label: "Niebieski", color: "#007aff" },
  { value: "purple", label: "Fioletowy", color: "#af52de" },
];

export const LESSON_LABEL_COLOR_VALUES = LESSON_LABEL_COLOR_OPTIONS.map(
  (option) => option.value,
);

export function getLessonLabelColorOption(
  color?: string | null,
): LessonLabelColorOption | undefined {
  return LESSON_LABEL_COLOR_OPTIONS.find((option) => option.value === color);
}
