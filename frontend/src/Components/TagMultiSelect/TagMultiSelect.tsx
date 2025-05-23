import React, { useState, useEffect } from "react";
import { TextField, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { SimpleTag } from "../../types";
import { getTags } from "../../Api/TagApi";

type TagMultiSelectProps = {
  selectedTags: SimpleTag[];
  onChange: (tags: SimpleTag[]) => void;
};

const TagMultiSelect: React.FC<TagMultiSelectProps> = ({ selectedTags = [], onChange }) => {
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState<SimpleTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getTags().then((data) => {
      setTags(data.map((t: any) => ({ id: t.id, title: t.title })));
      setLoading(false);
    });
  }, []);

  // Обрані теги завжди на початку
  const selected = tags.filter(tag => selectedTags.some(t => t.id === tag.id));
  // Далі максимум 5 знайдених тегів, які ще не обрані
  const filtered = tags
    .filter(
      (tag) =>
        tag.title.toLowerCase().includes(search.toLowerCase()) &&
        !selectedTags.some((t) => t.id === tag.id)
    )
    .slice(0, 5);

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
        label="Search tags"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        size="small"
      />
      {loading ? (
        <CircularProgress size={24} sx={{ mt: 2 }} />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
            width: 700,
            // minWidth: 500,
            // maxWidth: 500,
          }}
        >
          {/* Обрані теги */}
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
          {/* Перші 5 знайдених тегів */}
          {filtered.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.title}
              color="default"
              variant="outlined"
              onClick={() => handleToggle(tag)}
              sx={{ cursor: "pointer" }}
            />
          ))}
          {selected.length === 0 && filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No tags found
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TagMultiSelect;