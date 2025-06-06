import React, { useState } from "react";
import { Box, Chip, TextField, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

type TagNameMultiInputProps = {
  tagNames: string[];
  onChange: (tags: string[]) => void;
  label?: string;
};

const TagNameMultiInput: React.FC<TagNameMultiInputProps> = ({
  tagNames = [],
  onChange,
  label = "Додати теги",
}) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tagNames.includes(trimmed)) {
      onChange([...tagNames, trimmed]);
    }
    setInput("");
  };

  const handleRemove = (name: string) => {
    onChange(tagNames.filter((t) => t !== name));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Box sx={{ mt: 2, width: "100%", minWidth: 240, maxWidth: 700 }}>
      <TextField
        label={label}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleInputKeyDown}
        fullWidth
        size="small"
        InputProps={{
          endAdornment: (
            <IconButton
              aria-label="add tag"
              onClick={handleAdd}
              edge="end"
              disabled={!input.trim() || tagNames.includes(input.trim())}
              size="small"
            >
              <AddIcon />
            </IconButton>
          ),
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 1,
          width: "100%",
        }}
      >
        {tagNames.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Нічого не додано
          </Typography>
        )}
        {tagNames.map((name) => (
          <Chip
            key={name}
            label={name}
            color="primary"
            onClick={() => handleRemove(name)}
            onDelete={() => handleRemove(name)}
            deleteIcon={<CloseIcon />}
            sx={{ cursor: "pointer" }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TagNameMultiInput;