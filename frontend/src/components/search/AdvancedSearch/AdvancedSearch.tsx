import React, { useState, useEffect, useMemo } from "react";
import { Box, Button, Typography } from "@mui/material";
import EntityChipSelect from "../../ui/EntityChipSelect";
import { SimpleTag, SimpleAuthor } from "../../../types";
import { useTags } from "../../../hooks/useTags";
import { useAuthors } from "../../../hooks/useAuthors";

type AdvancedSearchProps = {
  initialAuthorIds?: number[];
  initialTagIds?: number[];
  onSearch: (params: { Title?: string; AuthorIds?: number[]; TagIds?: number[] }) => void;
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  initialAuthorIds = [],
  initialTagIds = [],
  onSearch,
}) => {
  const [selectedTags, setSelectedTags] = useState<SimpleTag[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<SimpleAuthor[]>([]);

  const { data: tagsData } = useTags({ PageSize: 1000 });
  const { data: authorsData } = useAuthors({ PageSize: 1000 });

  const availableTags: SimpleTag[] = useMemo(
    () => (tagsData?.items || []).map((t) => ({ id: t.id, title: t.title || "" })),
    [tagsData]
  );
  const availableAuthors: SimpleAuthor[] = useMemo(
    () => (authorsData?.items || []).map((a) => ({ id: a.id, name: a.name || "" })),
    [authorsData]
  );

  const initialAuthorIdsKey = initialAuthorIds.join(",");
  const initialTagIdsKey = initialTagIds.join(",");

  useEffect(() => {
    if (availableAuthors.length > 0 && initialAuthorIds.length > 0) {
      const initialSet = new Set(initialAuthorIds.map(Number));
      const matched = availableAuthors.filter((a) => initialSet.has(Number(a.id)));
      setSelectedAuthors(matched);
    } else if (initialAuthorIds.length === 0) {
      setSelectedAuthors([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableAuthors, initialAuthorIdsKey]);

  useEffect(() => {
    if (availableTags.length > 0 && initialTagIds.length > 0) {
      const initialSet = new Set(initialTagIds.map(Number));
      const matched = availableTags.filter((t) => initialSet.has(Number(t.id)));
      setSelectedTags(matched);
    } else if (initialTagIds.length === 0) {
      setSelectedTags([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTags, initialTagIdsKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      AuthorIds: selectedAuthors.map((a) => Number(a.id)),
      TagIds: selectedTags.map((t) => Number(t.id)),
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
              Автори
            </Typography>
            {selectedAuthors.length > 0 && (
              <Button
                size="small"
                color="error"
                onClick={() => setSelectedAuthors([])}
                sx={{ textTransform: "none", paddingX: 0.5, paddingY: 0, minWidth: "auto" }}
              >
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
              Теги
            </Typography>
            {selectedTags.length > 0 && (
              <Button
                size="small"
                color="error"
                onClick={() => setSelectedTags([])}
                sx={{ textTransform: "none", paddingX: 0.5, paddingY: 0, minWidth: "auto" }}
              >
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
        variant="outlined"
        size="large"
        fullWidth
        color="primary"
        sx={{ mt: 1 }}
      >
        Застосувати фільтри
      </Button>
    </Box>
  );
};

export default AdvancedSearch;