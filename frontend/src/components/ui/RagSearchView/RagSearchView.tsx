import React from "react";
import { CheatSheet } from "../../../types";
import { Box, Typography, Chip, Divider, Paper, Stack } from "@mui/material";
import BookCard from "../../books/BookCard/BookCard";
import { useNavigate } from "react-router-dom";
import { forwardRef } from "react";

type Props = {
  cheatSheet: CheatSheet;
};

const RagSearchView = forwardRef<HTMLDivElement, Props>(({ cheatSheet }, ref) => {
  const navigate = useNavigate();

  return (
    <Paper
      ref={ref}
      elevation={3}
      sx={{
        width: "100%",
        mx: "auto",
        my: 3,
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
      }}
    >
      {/* Поради */}
      {cheatSheet.tips.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Поради
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {cheatSheet.tips.map((tip, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderLeft: "4px solid",
                  borderColor: "primary.main",
                  fontSize: "1.05rem",
                  color: "text.primary",
                }}
              >
                {tip}
              </Paper>
            ))}
          </Stack>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Теги */}
      {cheatSheet.tags.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Теги
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {cheatSheet.tags.map(tag => (
              <Chip
                key={tag.id}
                label={tag.title}
                clickable
                color="primary"
                onClick={() => navigate(`/tags/${tag.id}`)}
                sx={{ fontSize: "1rem" }}
              />
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Книги */}
      {cheatSheet.books.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Книги
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {cheatSheet.books.map(book => (
              <BookCard key={book.id} {...book} />
            ))}
          </Box>
        </>
      )}

      {/* Якщо нічого не знайдено */}
      {cheatSheet.tips.length === 0 &&
        cheatSheet.books.length === 0 &&
        cheatSheet.tags.length === 0 && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Нічого не знайдено.
          </Typography>
        )}
    </Paper>
  );
});

export default RagSearchView;