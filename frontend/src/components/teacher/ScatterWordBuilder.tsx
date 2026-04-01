import { useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AddCircleOutline as AddIcon } from "@mui/icons-material";
import { uiTokens } from "@/theme/uiTokens";

interface ScatterWordBuilderProps {
  words: string;
  onChange: (words: string) => void;
}

export function ScatterWordBuilder({
  words,
  onChange,
}: ScatterWordBuilderProps) {
  const [inputValue, setInputValue] = useState("");

  const wordList = words ? words.split("|").filter(Boolean) : [];

  const addWord = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const updated = [...wordList, trimmed];
    onChange(updated.join("|"));
    setInputValue("");
  };

  const removeWord = (index: number) => {
    const updated = wordList.filter((_, i) => i !== index);
    onChange(updated.join("|"));
  };

  return (
    <Stack spacing={1.25}>
      <Typography variant="body2" fontWeight={600}>
        Słowa do ułożenia
      </Typography>

      {wordList.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {wordList.map((word, index) => (
            <Chip
              key={index}
              label={word}
              onDelete={() => removeWord(index)}
              sx={{
                borderRadius: uiTokens.radius.control,
                fontWeight: 600,
                border: "1.5px solid",
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                },
                "@keyframes chipAppear": {
                  from: { opacity: 0, transform: "scale(0.85)" },
                  to: { opacity: 1, transform: "scale(1)" },
                },
                animation: "chipAppear 0.2s ease-out",
              }}
            />
          ))}
        </Box>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          placeholder="Wpisz słowo i dodaj..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addWord();
            }
          }}
          fullWidth
          sx={{ flex: 1 }}
        />
        <IconButton
          onClick={addWord}
          color="primary"
          disabled={!inputValue.trim()}
          sx={{
            transition: "transform 0.15s ease",
            "&:hover": { transform: "scale(1.1)" },
          }}
        >
          <AddIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}
