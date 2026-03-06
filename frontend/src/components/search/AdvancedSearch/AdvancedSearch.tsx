import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import EntityChipSelect from "../../ui/EntityChipSelect";
import { SimpleTag, SimpleAuthor } from "../../../types";
import { useTags } from "../../../hooks/useTags";
import { useAuthors } from "../../../hooks/useAuthors";

type AdvancedSearchProps = {
  onSearch: (params: { Title?: string; AuthorIds?: number[]; TagIds?: number[] }) => void;
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSearch }) => {
  const [selectedTags, setSelectedTags] = useState<SimpleTag[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<SimpleAuthor[]>([]);

  const { data: tagsData } = useTags({ PageSize: 1000 });
  const { data: authorsData } = useAuthors({ PageSize: 1000 });

  const availableTags: SimpleTag[] = (tagsData?.items || []).map(t => ({ id: t.id, title: t.title || "" }));
  const availableAuthors: SimpleAuthor[] = (authorsData?.items || []).map(a => ({ id: a.id, name: a.name || "" }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      AuthorIds: selectedAuthors.map((a) => a.id),
      TagIds: selectedTags.map((t) => t.id),
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "100%",
        mt: 2,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
              Автори
            </Typography>
            {selectedAuthors.length > 0 && (
              <Button size="small" color="error" onClick={() => setSelectedAuthors([])} sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}>
                Очистити
              </Button>
            )}
          </Box>
          <EntityChipSelect<SimpleAuthor>
            label="Виберіть авторів"
            availableItems={availableAuthors}
            selectedItems={selectedAuthors}
            onChange={setSelectedAuthors}
            placeholder="Пошук авторів..."
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
              Теги
            </Typography>
            {selectedTags.length > 0 && (
              <Button size="small" color="error" onClick={() => setSelectedTags([])} sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}>
                Очистити
              </Button>
            )}
          </Box>
          <EntityChipSelect<SimpleTag>
            label="Виберіть теги"
            availableItems={availableTags}
            selectedItems={selectedTags}
            onChange={setSelectedTags}
            placeholder="Пошук тегів..."
          />
        </Box>
      </Box>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 2 }}
      >
        Застосувати фільтри
      </Button>
    </Box>
  );
};

export default AdvancedSearch;