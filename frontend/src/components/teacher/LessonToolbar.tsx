import {
  Autocomplete,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import {
  GridViewOutlined as GridIcon,
  SearchOutlined as SearchIcon,
  ViewListOutlined as ListIcon,
} from "@mui/icons-material";
import type { SelectChangeEvent } from "@mui/material";
import type { Group } from "@/api/lessonService";
import { panelToolbarSx } from "@/components/ui/panel/panelStyles";

const toolbarFieldSx: SxProps<Theme> = {
  minWidth: 180,
  flex: "1 1 180px",
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
  "& .MuiInputBase-input": {
    fontSize: "0.85rem",
  },
};

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

  const handleSortChange = (e: SelectChangeEvent) => {
    onSortModeChange(e.target.value as SortMode);
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
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          ...(toolbarFieldSx as object),
          ...(compactToolbarFieldSx as object),
          minWidth: { xs: "100%", sm: 260, lg: 320 },
          flex: { xs: "1 1 100%", md: "1.45 1 280px" },
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
        limitTags={1}
        noOptionsText="Brak grup"
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...rest } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option.name}
                size="small"
                sx={{ fontSize: "0.7rem", height: 20 }}
                {...rest}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              selectedGroups.length === 0 ? "Filtruj grupy..." : undefined
            }
          />
        )}
        sx={{
          ...(toolbarFieldSx as object),
          ...(compactToolbarFieldSx as object),
          minWidth: { xs: "100%", sm: 220 },
          flex: { xs: "1 1 100%", lg: "1 1 230px" },
        }}
      />

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

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", md: "block" } }}
      />

      <Select
        size="small"
        value={sortMode}
        onChange={handleSortChange}
        sx={{
          ...(toolbarFieldSx as object),
          minWidth: 170,
          flex: "0 0 auto",
          fontSize: "0.82rem",
          "& .MuiSelect-select": { py: "6.5px", fontSize: "0.82rem" },
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
      </Select>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", md: "block" } }}
      />

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
