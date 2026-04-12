import React, { forwardRef } from "react";
import { RagResponse } from "../../../types";
import { Box, Typography, Chip, Paper, Stack, Button } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SearchIcon from "@mui/icons-material/Search";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { useNavigate } from "react-router-dom";

type Props = {
  ragResponse: RagResponse;
  onSearch?: (query: string) => void;
};

const RagSearchView = forwardRef<HTMLDivElement, Props>(({ ragResponse, onSearch }, ref) => {
  const navigate = useNavigate();

  return (
    <Box
      ref={ref}
      sx={{
        width: "100%",
        mx: "auto",
        my: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Джерела (Sources) */}
      {ragResponse.sources.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <MenuBookIcon color="primary" />
            <Typography variant="h6">Джерела</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: 2,
              pb: 1,
              minHeight: 0,
              "&::-webkit-scrollbar": { height: 6 },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "action.hover", borderRadius: 3 },
            }}
          >
            {ragResponse.sources.map((source) => (
              <Paper
                key={source.id}
                elevation={1}
                onClick={() => navigate(`/books/${source.bookId}`)}
                sx={{
                  width: 250,
                  flexShrink: 0,
                  p: 1.5,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {source.title}
                </Typography>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: "rgba(0, 122, 255, 0.1)", // Light background
                      color: "primary.main",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: "bold",
                      display: "inline-block",
                    }}
                  >
                    Стор. {source.pageStart}{source.pageStart !== source.pageEnd ? `-${source.pageEnd}` : ''}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontStyle: "italic",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  "{source.snippet}"
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Відповідь (Generated Answer) */}
      {ragResponse.answer && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">Відповідь</Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderLeft: "4px solid",
              borderColor: "primary.main",
              bgcolor: "background.paper",
              borderRadius: "0 8px 8px 0",
            }}
          >
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {ragResponse.answer}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Пов'язані теми та запитання */}
      {(ragResponse.relatedTags?.length > 0 || ragResponse.suggestedQuestions?.length > 0) && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <LightbulbIcon color="primary" />
            <Typography variant="h6">Дізнатися більше</Typography>
          </Box>
          <Stack spacing={2}>
            {/* Block 1: Tags */}
            {ragResponse.relatedTags?.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {ragResponse.relatedTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.title}
                    onClick={() => navigate(`/tags/${tag.id}`)}
                    clickable
                  />
                ))}
              </Box>
            )}

            {/* Block 2: Suggested Questions */}
            {ragResponse.suggestedQuestions?.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                {ragResponse.relatedTags?.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Можливі запитання:
                  </Typography>
                )}
                {ragResponse.suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    startIcon={<SearchIcon />}
                    variant="outlined"
                    color="primary"
                    onClick={() => onSearch && onSearch(question)}
                    sx={{ borderRadius: 0, textTransform: "none", justifyContent: "flex-start", textAlign: "left" }}
                  >
                    {question}
                  </Button>
                ))}
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
});

export default RagSearchView;