import React, { forwardRef } from "react";
import { RagResponse } from "../../../types";
import { Box, Typography, Chip, Paper, Stack, Button, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SearchIcon from "@mui/icons-material/Search";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { useNavigate } from "react-router-dom";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  ragResponse: RagResponse;
  thinkingText?: string;
  answerText?: string;
  onSearch?: (query: string) => void;
  rewrittenQuery?: string;
};

const RagSearchView = forwardRef<HTMLDivElement, Props>(({ ragResponse, thinkingText, answerText, onSearch, rewrittenQuery }, ref) => {
  const navigate = useNavigate();
  
  const displayAnswer = answerText !== undefined ? answerText : ragResponse.answer;

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
      {/* Переписаний запит (примітка) */}
      {rewrittenQuery && rewrittenQuery.trim() !== ragResponse.query.trim() && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.disabled",
            fontStyle: "italic",
            mt: -1,
            mb: -1,
            pl: 0.5,
          }}
        >
          🔍 Покращений запит: {rewrittenQuery}
        </Typography>
      )}

      {/* Джерела (Sources) */}
      {ragResponse.sources.length > 0 && (
        <Box className="tour-rag-sources">
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    Книга #{source.bookId}
                  </Typography>
                  {source.similarityScore !== undefined && (
                    <Chip
                      label={`${Math.round(source.similarityScore * 100)}%`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem", flexShrink: 0 }}
                    />
                  )}
                </Box>
                {source.pageStart > 0 && source.pageEnd > 0 && (
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
                )}
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
                  "{source.text}"
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Роздуми (Thinking) */}
      {thinkingText && thinkingText.trim().length > 0 && (
        <Box className="tour-rag-thinking">
          <Accordion 
            elevation={0}
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.03)",
              border: "1px solid",
              borderColor: "divider",
              "&:before": { display: "none" }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PsychologyIcon color="secondary" />
                <Typography variant="subtitle1" fontWeight="medium">Процес міркування</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}
              >
                {thinkingText}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Відповідь (Generated Answer) */}
      {displayAnswer && (
        <Box className="tour-rag-answer">
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <Typography variant="body1" sx={{ mb: 2 }} {...props} />,
                h1: ({ node, ...props }) => <Typography variant="h4" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }} {...props} />,
                h2: ({ node, ...props }) => <Typography variant="h5" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }} {...props} />,
                h3: ({ node, ...props }) => <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
                h4: ({ node, ...props }) => <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }} {...props} />,
                h5: ({ node, ...props }) => <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }} {...props} />,
                h6: ({ node, ...props }) => <Typography variant="caption" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }} {...props} />,
                ul: ({ node, ...props }) => <Box component="ul" sx={{ pl: 3, mb: 2 }} {...props} />,
                ol: ({ node, ...props }) => <Box component="ol" sx={{ pl: 3, mb: 2 }} {...props} />,
                li: ({ node, ...props }) => <Typography component="li" variant="body1" sx={{ mb: 1 }} {...props} />,
                a: ({ node, ...props }) => <Typography component="a" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }} {...props} />,
                table: ({ node, ...props }) => (
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small" {...props} />
                  </TableContainer>
                ),
                thead: ({ node, ...props }) => <TableHead sx={{ bgcolor: 'action.hover' }} {...props} />,
                tbody: ({ node, ...props }) => <TableBody {...props} />,
                tr: ({ node, ...props }) => <TableRow {...props} />,
                th: ({ node, ...props }) => <TableCell sx={{ fontWeight: 'bold' }} {...(props as any)} />,
                td: ({ node, ...props }) => <TableCell {...(props as any)} />,
                blockquote: ({ node, ...props }) => (
                  <Box sx={{ borderLeft: '4px solid', borderColor: 'divider', pl: 2, py: 1, mb: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="body2" color="text.secondary" {...props} />
                  </Box>
                ),
              }}
            >
              {displayAnswer}
            </ReactMarkdown>
          </Box>
        </Box>
      )}

      {/* Пов'язані теми та запитання */}
      {((ragResponse.relatedTags && ragResponse.relatedTags.length > 0) || (ragResponse.suggestedQuestions && ragResponse.suggestedQuestions.length > 0)) && (
        <Box className="tour-rag-related">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <LightbulbIcon color="primary" />
            <Typography variant="h6">Дізнатися більше</Typography>
          </Box>
          <Stack spacing={2}>
            {/* Block 1: Tags */}
            {ragResponse.relatedTags && ragResponse.relatedTags.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {ragResponse.relatedTags?.map((tag) => (
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
            {ragResponse.suggestedQuestions && ragResponse.suggestedQuestions.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                {ragResponse.relatedTags && ragResponse.relatedTags.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Можливі запитання:
                  </Typography>
                )}
                {ragResponse.suggestedQuestions?.map((question, idx) => (
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