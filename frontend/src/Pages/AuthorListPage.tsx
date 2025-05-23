import React, { useEffect, useState } from "react";
import { Typography, CircularProgress, Box } from "@mui/material";
import AuthorCard from "../Components/AuthorCard/AuthorCard";
import { getAuthors } from "../Api/AuthorApi";
import PageContainer from "../Components/PageContainer/PageContainer";
import { Author } from "../types";

const AuthorListPage: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthors()
      .then(setAuthors)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>
        Authors
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column"}}>
          {authors.map((author) => (
            <Box key={author.id}>
              <AuthorCard author={author} />
            </Box>
          ))}
        </Box>
      )}
    </PageContainer>
  );
};

export default AuthorListPage;