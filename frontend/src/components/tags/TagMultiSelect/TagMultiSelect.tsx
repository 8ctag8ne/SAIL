import React, { useState, useEffect } from "react";
import { TextField, Box, Chip, Typography, Button } from "@mui/material";
import { SimpleTag } from "../../../types";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import { useTags } from "../../../hooks/useTags";

type TagMultiSelectProps = {
  selectedTags: SimpleTag[];
  onChange: (tags: SimpleTag[]) => void;
};

const TagMultiSelect: React.FC<TagMultiSelectProps> = ({ selectedTags = [], onChange }) => {
  const [search, setSearch] = useState("");
  const [displayCount, setDisplayCount] = useState(5);

  const { data, isLoading } = useTags({ PageSize: 1000 });
  const allTags = data?.items.map((t) => ({ id: t.id, title: t.title || "" })) || [];

  // Скидаємо лічильник при зміні пошуку
  useEffect(() => {
    setDisplayCount(5);
  }, [search]);

  const selected = allTags.filter(tag => selectedTags.some(t => t.id === tag.id));

  const fullFiltered = allTags.filter(
    (tag) =>
      tag.title.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  );

  const displayedFiltered = fullFiltered.slice(0, displayCount);

  const handleToggle = (tag: SimpleTag) => {
    if (selectedTags.some((t) => t.id === tag.id)) {
      onChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <Box sx={{ mt: 2, width: "100%", minWidth: 240, maxWidth: 700 }}>
      <TextField
        label="Пошук тегів"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        size="small"
      />
      {isLoading ? (
        <LoadingIndicator minHeight={24} />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
            width: 700,
          }}
        >
          {selected.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.title}
              color="primary"
              variant="filled"
              onClick={() => handleToggle(tag)}
              sx={{ cursor: "pointer" }}
            />
          ))}
          {displayedFiltered.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.title}
              color="default"
              variant="outlined"
              onClick={() => handleToggle(tag)}
              sx={{ cursor: "pointer" }}
            />
          ))}
          {fullFiltered.length > displayCount && (
            <Button
              variant="text"
              size="small"
              onClick={() => setDisplayCount(prev => prev + 5)}
              sx={{ mt: 1 }}
            >
              Більше
            </Button>
          )}
          {selected.length === 0 && fullFiltered.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Нічого не знайдено.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TagMultiSelect;