import React, { useEffect, useState } from "react";
import { Typography, CircularProgress, Box } from "@mui/material";
import TagCard from "../Components/TagCard/TagCard";
import { getTags } from "../Api/TagApi";
import PageContainer from "../Components/PageContainer/PageContainer";
import { Tag } from "../types";

const TagListPage: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTags()
      .then(setTags)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>
        Tags
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column"}}>
          {tags.map((tag) => (
            <Box key={tag.id}>
              <TagCard tag={tag} />
            </Box>
          ))}
        </Box>
      )}
    </PageContainer>
  );
};

export default TagListPage;