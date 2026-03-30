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
import {
  GridViewOutlined as GridIcon,
  SearchOutlined as SearchIcon,
  ViewListOutlined as ListIcon,
} from "@mui/icons-material";
import type { SelectChangeEvent } from "@mui/material";
import type { Group } from "@/api/lessonService";
import { panelToolbarSx } from "@/components/ui/panel/panelStyles";

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
          minWidth: 180,
          flex: "1 1 180px",
          "& .MuiOutlinedInput-root": { borderRadius: 2 },
        }}
      />

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", sm: "block" } }}
      />

      <Autocomplete
        multiple
        size="small"
        options={availableGroups}
        value={selectedGroups}
        onChange={(_, newValue) => onSelectedGroupsChange(newValue)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        )}
        sx={{ minWidth: 190, flex: "1 1 190px" }}
      />

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", sm: "block" } }}
      />

      <ToggleButtonGroup
        value={statusFilter}
        exclusive
        onChange={handleStatusChange}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <ToggleButton
          value="all"
          sx={{
            textTransform: "none",
            px: 1.5,
            borderRadius: "8px !important",
          }}
        >
          Wszystkie
        </ToggleButton>
        <ToggleButton value="active" sx={{ textTransform: "none", px: 1.5 }}>
          Aktywne
        </ToggleButton>
        <ToggleButton value="inactive" sx={{ textTransform: "none", px: 1.5 }}>
          Nieaktywne
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", sm: "block" } }}
      />

      <Select
        size="small"
        value={sortMode}
        onChange={handleSortChange}
        sx={{
          minWidth: 170,
          borderRadius: 2,
          "& .MuiSelect-select": { py: "6.5px" },
        }}
      >
        <MenuItem value="date_desc">Data: Najnowsze</MenuItem>
        <MenuItem value="date_asc">Data: Najstarsze</MenuItem>
        <MenuItem value="title_az">Tytuł: A-Z</MenuItem>
        <MenuItem value="title_za">Tytuł: Z-A</MenuItem>
      </Select>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", sm: "block" } }}
      />

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleViewChange}
        size="small"
        sx={{ flexShrink: 0 }}
      >
        <ToggleButton
          value="grid"
          aria-label="Widok siatki"
          sx={{ borderRadius: "8px !important" }}
        >
          <GridIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="list" aria-label="Widok listy">
          <ListIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
