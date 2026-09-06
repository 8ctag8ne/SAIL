import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  DialogTitle,
  IconButton,
  Stack
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EntityModal from "../../ui/EntityModal/EntityModal";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMarkdownByBookId, createMarkdown, updateMarkdown, autoParsePdfToMarkdown, getParseStatus } from "../../../api/markdownApi";
import { toast } from "react-fox-toast";

type MarkdownEditorModalProps = {
  open: boolean;
  bookId: number;
  onClose: () => void;
  onSaved?: () => void;
  parsed?: boolean;
};

const MarkdownEditorModal: React.FC<MarkdownEditorModalProps> = ({ open, bookId, onClose, onSaved, parsed }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      loadMarkdown();
    }
  }, [open, bookId]);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  const loadMarkdown = async () => {
    setIsLoading(true);
    try {
      const data = await getMarkdownByBookId(bookId);
      if (data && data.id > 0) {
        setContent(data.content);
        setIsExisting(true);
      } else {
        setContent("");
        setIsExisting(false);
      }
    } catch (error) {
      console.error("Failed to load markdown", error);
      setContent("");
      setIsExisting(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isExisting) {
        await updateMarkdown(bookId, content);
      } else {
        await createMarkdown(bookId, content);
      }
      toast.success("Markdown збережено успішно", { isCloseBtn: true });
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      toast.error("Помилка при збереженні", { isCloseBtn: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoParse = async () => {
    setIsParsing(true);
    try {
      const { taskId } = await autoParsePdfToMarkdown(bookId);
      toast.success("Аналіз запущено", { isCloseBtn: true });

      pollingTimerRef.current = setInterval(async () => {
        try {
          const { status, error, markdown } = await getParseStatus(taskId);
          if (status === "completed") {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            setIsParsing(false);
            toast.success("Аналіз успішно завершено", { isCloseBtn: true });
            if (markdown) {
              setContent(markdown);
            }
          } else if (status === "failed") {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            setIsParsing(false);
            toast.error(error || "Помилка аналізу", { isCloseBtn: true });
          }
        } catch (err) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setIsParsing(false);
          toast.error("Помилка при перевірці статусу", { isCloseBtn: true });
        }
      }, 3000);

    } catch (error) {
      toast.error("Помилка при запуску аналізу", { isCloseBtn: true });
      setIsParsing(false);
    }
  };

  return (
    <EntityModal open={open} onClose={onClose}>
      <Paper
        elevation={3}
        sx={{
          width: 900,
          maxWidth: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 0,
          bgcolor: "background.paper",
          boxSizing: "border-box",
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {parsed ? "Редагувати Markdown" : "Переглянути/Аналізувати текст"}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary", mr: -0.5, p: 0.5 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, flexShrink: 0 }}>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="markdown tabs">
              <Tab label="Редагування" />
              <Tab label="Попередній перегляд" />
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {tabIndex === 0 && (
                  <Box sx={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    <TextField
                      multiline
                      fullWidth
                      variant="outlined"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      sx={{
                        flexGrow: 1,
                        "& .MuiInputBase-root": {
                          height: "100%",
                          alignItems: "flex-start",
                          overflowY: "auto",
                          fontFamily: "monospace",
                        },
                      }}
                    />
                  </Box>
                )}
                {tabIndex === 1 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      flexGrow: 1,
                      p: 2,
                      overflowY: "auto",
                      bgcolor: "background.default",
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
                      {content || "*Текст відсутній*"}
                    </ReactMarkdown>
                  </Paper>
                )}
              </>
            )}
          </Box>

          <Stack direction="column" spacing={2} sx={{ mt: 3, flexShrink: 0 }}>

            <Button
              variant="outlined"
              color="secondary"
              onClick={handleAutoParse}
              disabled={isLoading || isParsing || isSaving}
              fullWidth
              sx={{ height: 48 }}
            >
              {isParsing ? <CircularProgress size={24} /> : "Автоматичний аналіз"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSave}
              disabled={isLoading || isSaving || isParsing}
              fullWidth
              sx={{ height: 48 }}
            >
              {isSaving ? <CircularProgress size={24} /> : "Зберегти"}
            </Button>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isSaving || isParsing}
              fullWidth
              sx={{ height: 48 }}
            >
              Скасувати
            </Button>
          </Stack>
        </Box>
      </Paper>
    </EntityModal>
  );
};

export default MarkdownEditorModal;
