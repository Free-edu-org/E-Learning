import {
  Autocomplete,
  Box,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import {
  GridViewOutlined as GridIcon,
  SearchOutlined as SearchIcon,
  ViewListOutlined as ListIcon,
  SortOutlined as SortIcon,
} from "@mui/icons-material";

import type { Group } from "@/api/lessonService";
import { panelToolbarSx } from "@/components/ui/panel/panelStyles";
import {
  LESSON_LABEL_COLOR_OPTIONS,
  type LessonLabelColor,
} from "@/constants/lessonLabelColors";

export const NO_LABEL_COLOR_FILTER = "none" as const;
export type LessonLabelColorFilter =
  LessonLabelColor | typeof NO_LABEL_COLOR_FILTER;

const toolbarFieldSx: SxProps<Theme> = {
  minWidth: 180,
  flex: "1 1 180px",
  "& .MuiAutocomplete-inputRoot": {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.common.white, 0.98)
        : "#151a2c",
    borderRadius: 2,
    minHeight: 40,
    border: "1px solid",
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.primary, 0.06)
        : alpha(theme.palette.common.white, 0.06),
    boxShadow: (theme: Theme) =>
      theme.palette.mode === "light"
        ? "0 2px 8px rgba(15, 23, 42, 0.035)"
        : "inset 0 1px 0 rgba(255,255,255,0.02)",
    transition:
      "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
    "&:hover": {
      borderColor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.primary.main, 0.14)
          : alpha(theme.palette.common.white, 0.1),
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light" ? theme.palette.common.white : "#171d2f",
    },
    "&.Mui-focused": {
      borderColor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.primary.main, 0.22)
          : alpha(theme.palette.primary.light, 0.2),
      boxShadow: (theme: Theme) =>
        theme.palette.mode === "light"
          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`
          : `0 0 0 3px ${alpha(theme.palette.primary.light, 0.08)}`,
    },
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    minHeight: 40,
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.common.white, 0.98)
        : "#151a2c",
    border: "1px solid",
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.primary, 0.06)
        : alpha(theme.palette.common.white, 0.06),
    boxShadow: (theme: Theme) =>
      theme.palette.mode === "light"
        ? "0 2px 8px rgba(15, 23, 42, 0.035)"
        : "inset 0 1px 0 rgba(255,255,255,0.02)",
    transition:
      "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
    "& fieldset": {
      border: "none",
    },
    "&:hover": {
      borderColor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.primary.main, 0.14)
          : alpha(theme.palette.common.white, 0.1),
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light" ? theme.palette.common.white : "#171d2f",
    },
    "&.Mui-focused": {
      borderColor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.primary.main, 0.22)
          : alpha(theme.palette.primary.light, 0.2),
      boxShadow: (theme: Theme) =>
        theme.palette.mode === "light"
          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`
          : `0 0 0 3px ${alpha(theme.palette.primary.light, 0.08)}`,
    },
  },
  "& .MuiInputBase-input::placeholder": {
    opacity: 1,
    color: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.secondary, 0.8)
        : alpha(theme.palette.common.white, 0.38),
  },
};

const compactToolbarFieldSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root.MuiInputBase-root": {
    minHeight: 38,
  },
  "& .MuiAutocomplete-inputRoot": {
    minHeight: "38px !important",
  },
  "& .MuiInputBase-input": {
    fontSize: "0.85rem",
  },
};

const searchAdornmentSx: SxProps<Theme> = {
  ml: 0,
  mr: 1,
  alignSelf: "center",
  flexShrink: 0,
};

const searchAdornmentSelectorSx = {
  ml: 0,
  mr: 1,
  alignSelf: "center",
  flexShrink: 0,
};

const searchIconSx: SxProps<Theme> = {
  color: "text.secondary",
  fontSize: 20,
  opacity: 1,
  flexShrink: 0,
};

const searchFieldChromeSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root, & .MuiAutocomplete-inputRoot, &.MuiInputBase-root":
    {
      minHeight: "38px !important",
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
    },
  "& .MuiInputAdornment-positionStart": searchAdornmentSelectorSx,
  "& .MuiInputBase-input": {
    fontSize: "0.85rem",
    lineHeight: 1.2,
    paddingTop: "0 !important",
    paddingBottom: "0 !important",
    minWidth: 0,
  },
};

const searchTextFieldSx: SxProps<Theme> = {
  ...(searchFieldChromeSx as object),
  "& .MuiOutlinedInput-root": {
    pl: 1.5,
    pr: 1.5,
  },
};

const searchAutocompleteFieldSx: SxProps<Theme> = {
  ...(searchFieldChromeSx as object),
  "& .MuiAutocomplete-inputRoot": {
    pl: "12px !important",
    pr: "36px !important",
    gap: 0,
  },
  "& .MuiAutocomplete-input": {
    padding: "0 !important",
  },
  "& .MuiAutocomplete-endAdornment": {
    right: 8,
  },
};

const searchSelectFieldSx: SxProps<Theme> = {
  "&.MuiInputBase-root": {
    minHeight: "38px !important",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    pl: 1.5,
    pr: 4,
  },
  "& .MuiSelect-select": {
    minHeight: "auto !important",
    padding: "0 !important",
    fontSize: "0.85rem",
    fontWeight: 400,
    lineHeight: 1.2,
    color: "text.primary",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-icon": {
    right: 10,
  },
};

const fixedAutocompleteFieldSx: SxProps<Theme> = {
  "& .MuiAutocomplete-inputRoot": {
    flexWrap: "nowrap",
    alignItems: "center",
    overflow: "hidden",
    minHeight: "38px !important",
    maxHeight: "38px",
    py: "0 !important",
  },
  "& .MuiAutocomplete-input": {
    flex: "1 1 72px !important",
    minWidth: "72px !important",
    width: "auto !important",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  "& .MuiAutocomplete-tag": {
    m: 0,
  },
};

const selectToolbarFieldSx: SxProps<Theme> = {
  borderRadius: 2,
  minHeight: 38,
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.white, 0.98)
      : "#151a2c",
  border: "1px solid",
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.06)
      : alpha(theme.palette.common.white, 0.06),
  boxShadow: (theme: Theme) =>
    theme.palette.mode === "light"
      ? "0 2px 8px rgba(15, 23, 42, 0.035)"
      : "inset 0 1px 0 rgba(255,255,255,0.02)",
  transition:
    "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
  "& fieldset": { border: "none" },
  "&:hover": {
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.14)
        : alpha(theme.palette.common.white, 0.1),
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light" ? theme.palette.common.white : "#171d2f",
  },
  "&.Mui-focused": {
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.22)
        : alpha(theme.palette.primary.light, 0.2),
    boxShadow: (theme: Theme) =>
      theme.palette.mode === "light"
        ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`
        : `0 0 0 3px ${alpha(theme.palette.primary.light, 0.08)}`,
  },
};

const compactAutocompleteValueSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  minWidth: 0,
  maxWidth: "calc(100% - 38px)",
  overflow: "hidden",
  whiteSpace: "nowrap",
  flexShrink: 1,
};

const compactSelectPlaceholderSx: SxProps<Theme> = {
  fontSize: "0.85rem",
  fontWeight: 400,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const searchPlaceholderRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  minWidth: 0,
  color: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.secondary, 0.8)
      : alpha(theme.palette.common.white, 0.38),
};

function SearchStartAdornment() {
  return (
    <InputAdornment position="start" sx={searchAdornmentSx}>
      <SearchIcon
        fontSize="small"
        className="toolbar-search-icon"
        sx={searchIconSx}
      />
    </InputAdornment>
  );
}

function SearchPlaceholderText({ children }: { children: React.ReactNode }) {
  return <Typography sx={compactSelectPlaceholderSx}>{children}</Typography>;
}

function SearchPlaceholderRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={searchPlaceholderRowSx}>
      <SearchIcon
        fontSize="small"
        className="toolbar-search-icon"
        sx={searchIconSx}
      />
      <SearchPlaceholderText>{children}</SearchPlaceholderText>
    </Box>
  );
}

const segmentedGroupSx: SxProps<Theme> = {
  p: 0.375,
  borderRadius: 2.5,
  bgcolor: "transparent",
  border: "none",
  gap: 0.375,
  "& .MuiToggleButtonGroup-grouped": {
    border: 0,
    borderRadius: "10px !important",
    minHeight: 32,
    px: 1.25,
    textTransform: "none",
    color: "text.secondary",
    transition:
      "background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.common.black, 0.04)
          : alpha(theme.palette.common.white, 0.05),
    },
    "&.Mui-selected": {
      color: "text.primary",
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light"
          ? alpha(theme.palette.common.white, 0.92)
          : "#151a2c",
      boxShadow: (theme: Theme) =>
        theme.palette.mode === "light"
          ? "0 2px 8px rgba(15, 23, 42, 0.06)"
          : "0 4px 10px rgba(0, 0, 0, 0.16)",
    },
    "&.Mui-selected:hover": {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === "light" ? theme.palette.common.white : "#171d2f",
    },
  },
};

const segmentedStandaloneButtonSx: SxProps<Theme> = {
  textTransform: "none",
  borderRadius: 2.5,
  flexShrink: 0,
  borderColor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.text.primary, 0.08)
      : alpha(theme.palette.common.white, 0.06),
  color: "text.secondary",
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.white, 0.8)
      : "#111625",
  transition:
    "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light" ? theme.palette.common.white : "#151a2c",
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.text.primary, 0.12)
        : alpha(theme.palette.common.white, 0.1),
  },
  "&.Mui-selected": {
    color: "text.primary",
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.primary.light, 0.1),
    borderColor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? alpha(theme.palette.primary.main, 0.18)
        : alpha(theme.palette.primary.light, 0.18),
    boxShadow: (theme: Theme) =>
      theme.palette.mode === "light"
        ? "none"
        : "0 4px 10px rgba(0, 0, 0, 0.12)",
  },
};

export type StatusFilter = "all" | "active" | "inactive";
export type ViewMode = "grid" | "list";
export type SortMode = "date_desc" | "date_asc" | "title_az" | "title_za";

interface LessonToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  availableGroups: Group[];
  selectedGroups: Group[];
  onSelectedGroupsChange: (groups: Group[]) => void;
  selectedLabelColors: LessonLabelColorFilter[];
  onSelectedLabelColorsChange: (colors: LessonLabelColorFilter[]) => void;
}

export function LessonToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  sortMode,
  onSortModeChange,
  availableGroups,
  selectedGroups,
  onSelectedGroupsChange,
  selectedLabelColors,
  onSelectedLabelColorsChange,
}: LessonToolbarProps) {
  const handleStatusChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: StatusFilter | null,
  ) => {
    if (newValue !== null) onStatusFilterChange(newValue);
  };

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: ViewMode | null,
  ) => {
    if (newValue !== null) onViewModeChange(newValue);
  };

  const handleSortChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onSortModeChange(e.target.value as SortMode);
  };

  const handleColorFilterChange = (
    e: SelectChangeEvent<LessonLabelColorFilter[]>,
  ) => {
    const value = e.target.value;
    const nextValues = (
      typeof value === "string" ? value.split(",") : value
    ) as LessonLabelColorFilter[];
    onSelectedLabelColorsChange([...new Set(nextValues)]);
  };

  return (
    <Paper elevation={0} sx={{ ...panelToolbarSx, mb: 2 }}>
      <TextField
        size="small"
        placeholder="Szukaj lekcji..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <SearchStartAdornment />,
          },
        }}
        sx={{
          ...(toolbarFieldSx as object),
          ...(compactToolbarFieldSx as object),
          ...(searchTextFieldSx as object),
          minWidth: { xs: "100%", sm: 230, lg: 280 },
          flex: { xs: "1 1 100%", md: "1.2 1 250px" },
        }}
      />

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", md: "block" } }}
      />

      <Autocomplete
        multiple
        size="small"
        options={availableGroups}
        value={selectedGroups}
        onChange={(_, newValue) => onSelectedGroupsChange(newValue)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(opt, val) => opt.publicId === val.publicId}
        disableCloseOnSelect
        noOptionsText="Brak grup"
        renderTags={(tagValue, getTagProps) => {
          const [firstGroup] = tagValue;
          if (!firstGroup) return null;

          const { key, ...rest } = getTagProps({ index: 0 });
          const hiddenCount = tagValue.length - 1;

          return [
            <Chip
              key={key}
              label={firstGroup.name}
              size="small"
              sx={{
                fontSize: "0.7rem",
                height: 20,
                maxWidth: hiddenCount > 0 ? 110 : 150,
                flexShrink: 1,
                "& .MuiChip-label": {
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
                "& .MuiChip-deleteIcon": {
                  display: "none",
                },
              }}
              {...rest}
            />,
            ...(hiddenCount > 0
              ? [
                  <Chip
                    key="groups-more"
                    label={`+${hiddenCount}`}
                    size="small"
                    aria-label={`Jeszcze ${hiddenCount} wybranych grup`}
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />,
                ]
              : []),
          ];
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              selectedGroups.length === 0 ? "Filtruj grupy..." : undefined
            }
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchStartAdornment />
                    {params.InputProps.startAdornment}
                  </>
                ),
              },
            }}
          />
        )}
        sx={{
          ...(toolbarFieldSx as object),
          ...(compactToolbarFieldSx as object),
          ...(fixedAutocompleteFieldSx as object),
          ...(searchAutocompleteFieldSx as object),
          minWidth: { xs: "100%", sm: 220 },
          width: { xs: "100%", sm: 220, lg: 230 },
          flex: { xs: "0 0 100%", sm: "0 0 220px", lg: "0 0 230px" },
        }}
      />
      <Select
        multiple
        size="small"
        value={selectedLabelColors}
        onChange={handleColorFilterChange}
        displayEmpty
        renderValue={(selected) => {
          const selectedValues = selected as LessonLabelColorFilter[];
          if (selectedValues.length === 0) {
            return (
              <SearchPlaceholderRow>Filtruj kolory...</SearchPlaceholderRow>
            );
          }

          const firstValue = selectedValues[0];
          const firstColor =
            firstValue === NO_LABEL_COLOR_FILTER
              ? {
                  value: NO_LABEL_COLOR_FILTER,
                  label: "Bez koloru",
                  color: "transparent",
                }
              : LESSON_LABEL_COLOR_OPTIONS.find(
                  (option) => option.value === firstValue,
                );

          if (!firstColor) {
            return null;
          }

          const hiddenCount = selectedValues.length - 1;
          const compactLabel =
            hiddenCount > 0
              ? `${firstColor.label} + ${hiddenCount}`
              : firstColor.label;

          return (
            <Box sx={compactAutocompleteValueSx}>
              <Chip
                label={compactLabel}
                size="small"
                icon={
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor:
                        firstValue === NO_LABEL_COLOR_FILTER
                          ? "transparent"
                          : firstColor.color,
                      border: "1px dashed",
                      borderColor: (theme) =>
                        alpha(theme.palette.text.secondary, 0.45),
                    }}
                  />
                }
                sx={{
                  fontSize: "0.7rem",
                  height: 20,
                  maxWidth: 156,
                  flexShrink: 1,
                  "& .MuiChip-icon": { ml: 0.75 },
                }}
              />
            </Box>
          );
        }}
        sx={{
          ...(selectToolbarFieldSx as object),
          ...(searchSelectFieldSx as object),
          minWidth: { xs: "100%", sm: 210 },
          width: { xs: "100%", sm: 210, lg: 220 },
          flex: { xs: "0 0 100%", sm: "0 0 210px", lg: "0 0 220px" },
          fontSize: "0.85rem",
          "& .MuiSelect-select > .MuiBox-root": {
            minHeight: 24,
            width: "100%",
          },
        }}
      >
        <MenuItem value={NO_LABEL_COLOR_FILTER} sx={{ fontSize: "0.82rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "transparent",
                border: "1px dashed",
                borderColor: (theme) =>
                  alpha(theme.palette.text.secondary, 0.45),
                flexShrink: 0,
              }}
            />
            Bez koloru
          </Box>
        </MenuItem>
        {LESSON_LABEL_COLOR_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{ fontSize: "0.82rem" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: option.color,
                  boxShadow: (theme) =>
                    `0 0 0 1px ${alpha(theme.palette.text.primary, 0.14)}`,
                  flexShrink: 0,
                }}
              />
              {option.label}
            </Box>
          </MenuItem>
        ))}
      </Select>

      <TextField
        select
        size="small"
        value={sortMode}
        onChange={handleSortChange}
        sx={{
          ...(toolbarFieldSx as object),
          ...(compactToolbarFieldSx as object),
          minWidth: { xs: 140, sm: 170 },
          flex: "0 0 auto",
          fontSize: "0.85rem",
          "& .MuiSelect-select": {
            py: "6.5px",
            fontSize: "0.85rem",
            fontWeight: 400,
            color: "text.primary",
            lineHeight: 1.2,
            display: "flex",
            alignItems: "center",
          },
        }}
        slotProps={{
          select: {
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 1 }}>
                <SortIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          },
        }}
      >
        <MenuItem value="date_desc" sx={{ fontSize: "0.82rem" }}>
          Data: Najnowsze
        </MenuItem>
        <MenuItem value="date_asc" sx={{ fontSize: "0.82rem" }}>
          Data: Najstarsze
        </MenuItem>
        <MenuItem value="title_az" sx={{ fontSize: "0.82rem" }}>
          Tytuł: A-Z
        </MenuItem>
        <MenuItem value="title_za" sx={{ fontSize: "0.82rem" }}>
          Tytuł: Z-A
        </MenuItem>
      </TextField>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", md: "block" } }}
      />

      <ToggleButtonGroup
        value={statusFilter}
        exclusive
        onChange={handleStatusChange}
        size="small"
        sx={{
          ...(segmentedGroupSx as object),
          flexShrink: 0,
          alignSelf: "center",
        }}
      >
        <ToggleButton value="all" sx={segmentedStandaloneButtonSx}>
          Wszystkie
        </ToggleButton>
        <ToggleButton value="active" sx={segmentedStandaloneButtonSx}>
          Aktywne
        </ToggleButton>
        <ToggleButton value="inactive" sx={segmentedStandaloneButtonSx}>
          Nieaktywne
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleViewChange}
        size="small"
        sx={{ ...(segmentedGroupSx as object), flexShrink: 0 }}
      >
        <ToggleButton
          value="grid"
          aria-label="Widok siatki"
          sx={segmentedStandaloneButtonSx}
        >
          <GridIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="list"
          aria-label="Widok listy"
          sx={segmentedStandaloneButtonSx}
        >
          <ListIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
