import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import TagMultiSelect from "../TagMultiSelect/TagMultiSelect";
import SingleAuthorSelect from "../SingleAuthorSelect/SingleAuthorSelect";
import { SimpleTag, SimpleAuthor } from "../../types";

type AdvancedSearchProps = {
  onSearch: (params: { Title?: string; AuthorId?: number; TagIds?: number[] }) => void;
  width?: string | number;
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  width = 400,
}) => {
  const [selectedTags, setSelectedTags] = useState<SimpleTag[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<SimpleAuthor | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      AuthorId: selectedAuthor?.id,
      TagIds: selectedTags.map(t => t.id),
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: width,
        mx: "auto",
        mt: 2,
      }}
    >
      <Typography variant="subtitle1">Автор</Typography>
      <SingleAuthorSelect selectedAuthor={selectedAuthor} onChange={setSelectedAuthor} />
      <Typography variant="subtitle1">Теги</Typography>
      <TagMultiSelect selectedTags={selectedTags} onChange={setSelectedTags} />
      <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
        Застосувати фільтри
      </Button>
    </Box>
  );
};

export default AdvancedSearch;