//frontend/src/components/books/BookForm/BookForm.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia, IconButton, DialogTitle } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UniversalCreatableSelector from "../../ui/UniversalCreatableSelector";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import { SimpleAuthor, SimpleTag } from "../../../types";
import BASE_URL from "../../../config";
import { renderPdfFirstPage } from "../../../api/FileApi";
import { startMetadataExtraction, checkMetadataStatus } from "../../../api/AiApi";
import { toast } from "react-fox-toast";
import { useTags } from "../../../hooks/useTags";
import { useAuthors } from "../../../hooks/useAuthors";
import { useTour } from "../../../contexts/TourContext";

type BookFormProps = {
  initialData?: {
    title: string;
    info: string;
    imageUrl?: string;
    fileUrl?: string;
    tags?: SimpleTag[];
    authors?: SimpleAuthor[]; // ОНОВЛЕНО
  };
  onSubmit: (formData: FormData) => Promise<void>;
  onClose?: () => void;
};

const BookForm: React.FC<BookFormProps> = ({ initialData, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    info: initialData?.info || "",
    image: null as File | null,
    file: null as File | null,
    tags: initialData?.tags || ([] as SimpleTag[]),
    authors: initialData?.authors || ([] as SimpleAuthor[]), // ОНОВЛЕНО
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedTagNames, setSuggestedTagNames] = useState<string[]>([]);
  const [newAuthorNames, setNewAuthorNames] = useState<string[]>([]);

  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initialData?.imageUrl ?? undefined
  );
  const [fileName, setFileName] = useState<string>(
    initialData?.fileUrl ? initialData.fileUrl.split("/").pop() || "" : ""
  );
  const [generatingCover, setGeneratingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { run, activeTour, stepIndex, stopTour } = useTour();

  useEffect(() => {
    if (run && activeTour === "lib_create_book") {
      // stepIndex 4 is .tour-ai-analyze
      if (stepIndex === 4) {
        if (!form.file || form.file.type !== "application/pdf") {
          toast.info("Тур завершено, оскільки файл не було завантажено. Ви можете продовжувати самостійно.", { isCloseBtn: true });
          stopTour();
        }
      }
    }
  }, [run, activeTour, stepIndex, form.file, stopTour]);

  const { data: tagsData, isLoading: tagsLoading } = useTags({ PageSize: 1000 });
  const allTags = tagsData?.items.map((t) => ({ id: t.id, title: t.title || "" })) || [];

  const { data: authorsData, isLoading: authorsLoading } = useAuthors({ PageSize: 1000 });
  const allAuthors = authorsData?.items.map((a) => ({ id: a.id, name: a.name || "" })) || [];

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, image: file }));
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(initialData?.imageUrl ?? undefined);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
    setFileName(file ? file.name : (initialData?.fileUrl ? initialData.fileUrl.split("/").pop() || "" : ""));

    if (file && !form.image && file.type === "application/pdf") {
      setGeneratingCover(true);
      try {
        const blob = await renderPdfFirstPage(file);
        const coverFile = new File([blob], "cover.png", { type: "image/png" });
        setForm((prev) => ({ ...prev, image: coverFile }));
        setImagePreview(URL.createObjectURL(blob));
      } catch (err) {
        // handle error
      }
      setGeneratingCover(false);
    }
  };

  const handleGenerateCover = async () => {
    if (form.file && form.file.type === "application/pdf") {
      setGeneratingCover(true);
      try {
        const blob = await renderPdfFirstPage(form.file);
        const coverFile = new File([blob], "cover.png", { type: "image/png" });
        setForm((prev) => ({ ...prev, image: coverFile }));
        setImagePreview(URL.createObjectURL(blob));
      } catch (err) {
        // handle error
      }
      setGeneratingCover(false);
    }
  };

  const handleAnalyzeBook = async () => {
    if (form.file?.type === "application/pdf") {
      setAnalyzing(true);
      try {
        const { task_id } = await startMetadataExtraction(form.file);

        pollingTimerRef.current = setInterval(async () => {
          try {
            const { status, metadata, error } = await checkMetadataStatus(task_id);

            if (status === "completed") {
              if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

              if (metadata) {
                setForm(prev => ({
                  ...prev,
                  title: prev.title || metadata.title || "",
                  info: prev.info || metadata.description || "",
                }));

                // Автори
                let authorsArray: string[] = [];

                if (Array.isArray(metadata.author)) {
                  authorsArray = metadata.author.map((a: any) => typeof a === "string" ? a.trim() : "");
                } else if (typeof metadata.author === "string" && metadata.author.trim()) {
                  // Fallback for when the model occasionally returns a single string instead of an array
                  authorsArray = [metadata.author.trim()];
                }

                // Якщо масив порожній (або був null), встановлюємо значення "Невідомо"
                const activeAuthors = authorsArray.filter(a => a.length > 0);
                if (activeAuthors.length === 0) {
                  activeAuthors.push("Невідомо");
                }

                const matchedAuthors: SimpleAuthor[] = [];
                const newAuthorTexts: string[] = [];

                activeAuthors.forEach((authorStr) => {
                  const existingAuthor = allAuthors.find(a => a.name.toLowerCase() === authorStr.toLowerCase());
                  if (existingAuthor) {
                    matchedAuthors.push(existingAuthor);
                  } else {
                    newAuthorTexts.push(authorStr);
                  }
                });

                if (matchedAuthors.length > 0) {
                  setForm(prev => {
                    const existingIds = new Set(prev.authors.map(a => a.id));
                    const distinctMatched = matchedAuthors.filter(a => !existingIds.has(a.id));
                    return {
                      ...prev,
                      authors: [...prev.authors, ...distinctMatched]
                    };
                  });
                }

                if (newAuthorTexts.length > 0) {
                  setNewAuthorNames(prev => {
                    const combined = [...prev, ...newAuthorTexts];
                    return Array.from(new Set(combined));
                  });
                }

                // Теги
                if (metadata.tags && Array.isArray(metadata.tags)) {
                  const matchedTags: SimpleTag[] = [];
                  const newTags: string[] = [];

                  metadata.tags.forEach((tagStr: string) => {
                    const existingTag = allTags.find(t => t.title.toLowerCase() === tagStr.toLowerCase());
                    if (existingTag) {
                      matchedTags.push(existingTag);
                    } else {
                      newTags.push(tagStr);
                    }
                  });

                  setForm(prev => {
                    const existingIds = new Set(prev.tags.map(t => t.id));
                    const distinctMatched = matchedTags.filter(t => !existingIds.has(t.id));
                    return {
                      ...prev,
                      tags: [...prev.tags, ...distinctMatched]
                    };
                  });

                  setSuggestedTagNames(prev => {
                    const combined = [...prev, ...newTags];
                    return Array.from(new Set(combined));
                  });
                }
              }

              setAnalyzing(false);
              toast.success("Аналіз успішно завершено", { isCloseBtn: true });
            } else if (status === "failed") {
              if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
              setAnalyzing(false);
              toast.error(error || "Помилка аналізу на сервері", { isCloseBtn: true });
            }
          } catch (err) {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            setAnalyzing(false);
            console.error("Polling error:", err);
            toast.error("Помилка при перевірці статусу", { isCloseBtn: true });
          }
        }, 3000);
      } catch (error) {
        console.error("Start analysis error:", error);
        toast.error("Не вдалося запустити аналіз", {
          isCloseBtn: true,
        });
        setAnalyzing(false);
      }
    }
  };

  // (Handlers for Manual Author Inputs Remove)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валідація обов'язкових полів
    if (!form.title.trim()) {
      toast.warning("Будь ласка, заповніть назву книги");
      return;
    }

    // Перевірка наявності хоча б одного коректного автора
    if (form.authors.length === 0 && newAuthorNames.length === 0) {
      toast.warning("Додайте хоча б одного автора");
      return;
    }

    const formData = new FormData();
    setIsSubmitting(true);

    try {
      // Для нових книг: файл обов'язковий
      if (!initialData && !form.file) {
        toast.warning("Будь ласка, виберіть файл книги");
        setIsSubmitting(false);
        return;
      }

      // Додаємо файл тільки якщо він новий або це нова книга
      if (form.file) formData.append("file", form.file);

      // Додаємо зображення тільки якщо воно нове
      if (form.image) formData.append("image", form.image);

      // Основні дані
      formData.append("title", form.title);
      formData.append("info", form.info);

      // Автори
      form.authors.forEach(a =>
        formData.append("AuthorIds", a.id.toString())
      );

      // Нові автори
      newAuthorNames.forEach(aName =>
        formData.append("NewAuthorNames", aName)
      );

      // Теги
      form.tags.forEach(tag =>
        formData.append("TagIds", tag.id.toString())
      );

      // Нові теги
      suggestedTagNames.forEach(tagName =>
        formData.append("NewTagTitles", tagName)
      );

      await onSubmit(formData);

    } catch (error) {
      console.error("Помилка при збереженні:", error);
      toast.error("Сталася помилка. Перевірте дані.", {
        isCloseBtn: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 900,
        maxWidth: "100%",
        height: { xs: "100dvh", md: "90vh" },
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: { xs: 0, md: 2 },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <DialogTitle
          sx={{
            p: 3,
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "background.paper",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {initialData ? "Редагувати книгу" : "Створити книгу"}
          </Typography>
          {onClose && (
            <IconButton
              onClick={onClose}
              sx={{ color: "text.secondary", mr: -1 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>

        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* Ліва частина: фото та файл */}
          <Box sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box className="tour-cover-actions" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <CardMedia
                component="img"
                sx={{
                  width: "100%",
                  aspectRatio: "1/1.414",
                  objectFit: "cover",
                  borderRadius: 1,
                }}
                image={imagePreview || "https://placehold.co/180x240?text=No+Image"}
                alt="Book cover"
              />
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Завантажити фото
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                {imagePreview && !form.image && initialData?.imageUrl && "Поточне зображення"}
                {form.image && form.image.name}
              </Typography>

              {form.file && form.file.type === "application/pdf" && (
                <Button
                  className="tour-generate-cover"
                  variant="outlined"
                  fullWidth
                  type="button"
                  onClick={handleGenerateCover}
                  disabled={generatingCover}
                >
                  {generatingCover ? <LoadingIndicator minHeight={20} /> : "Звичайна обкладинка"}
                </Button>
              )}
            </Box>

            <Button
              className="tour-upload-pdf"
              variant="outlined"
              component="label"
              fullWidth
            >
              Завантажити файл
              <input
                type="file"
                hidden
                accept=".pdf,.epub"
                onChange={handleFileChange}
              />
            </Button>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              {fileName && `Файл: ${fileName}`}
            </Typography>

            {form.file && form.file.type === "application/pdf" && (
              <Button
                className="tour-ai-analyze"
                variant="outlined"
                fullWidth
                type="button"
                onClick={handleAnalyzeBook}
                disabled={analyzing}
              >
                {analyzing ? <LoadingIndicator minHeight={20} /> : "Аналізувати книгу"}
              </Button>
            )}
          </Box>
          {/* Права частина: форма */}
          <Box sx={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <Box className="tour-book-basic-info" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Назва"
                fullWidth
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <TextField
                label="Опис"
                fullWidth
                multiline
                rows={4}
                value={form.info}
                onChange={(e) => setForm({ ...form, info: e.target.value })}
              />
            </Box>

            <Box className="tour-book-multiselects" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <UniversalCreatableSelector
                label="Автори"
                options={allAuthors}
                selectedExisting={form.authors || []}
                selectedNew={newAuthorNames ?? []}
                onExistingChange={(authors) => setForm((prev) => ({ ...prev, authors: authors as SimpleAuthor[] }))}
                onNewChange={setNewAuthorNames}
                isLoading={authorsLoading}
              />
              <UniversalCreatableSelector
                label="Теги"
                options={allTags}
                selectedExisting={form.tags || []}
                selectedNew={suggestedTagNames ?? []}
                onExistingChange={(tags) => setForm((prev) => ({ ...prev, tags: tags as SimpleTag[] }))}
                onNewChange={setSuggestedTagNames}
                isLoading={tagsLoading}
              />
            </Box>

            <Button
              className="tour-submit-book"
              type="submit"
              variant="outlined"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              sx={{ height: 48, flexShrink: 0, mt: 1 }}
            >
              {isSubmitting ? <LoadingIndicator minHeight={24} /> : (initialData ? "Оновити книгу" : "Додати книгу")}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default BookForm;