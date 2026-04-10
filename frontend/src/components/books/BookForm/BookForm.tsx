import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia, IconButton, DialogTitle } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UniversalCreatableSelector from "../../ui/UniversalCreatableSelector";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import { SimpleAuthor, SimpleTag } from "../../../types";
import BASE_URL from "../../../config";
import { renderPdfFirstPage, analyzeBookPdf } from "../../../api/FileApi";
import { toast } from "react-fox-toast";
import { useTags } from "../../../hooks/useTags";
import { useAuthors } from "../../../hooks/useAuthors";

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

  const { data: tagsData, isLoading: tagsLoading } = useTags({ PageSize: 1000 });
  const allTags = tagsData?.items.map((t) => ({ id: t.id, title: t.title || "" })) || [];

  const { data: authorsData, isLoading: authorsLoading } = useAuthors({ PageSize: 1000 });
  const allAuthors = authorsData?.items.map((a) => ({ id: a.id, name: a.name || "" })) || [];

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
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
        const result = await analyzeBookPdf(form.file);

        setForm(prev => ({
          ...prev,
          title: prev.title || result.title,
          info: prev.info || result.description,
          tags: result.existingTags,// Уникаємо дублікатів
        }));

        // Додаємо авторів тільки якщо є результати
        if (result.authors?.length) {
          const newAuthors = result.authors.map(a => ({
            id: a.id || 0,
            name: a.name || ""
          })).filter(a => a.id !== 0);

          const newSuggestedAuthors = result.authors
            .filter(a => a.id === 0 && a.name)
            .map(a => a.name || "");

          setForm(prev => {
            const existingAuthorIds = new Set(prev.authors.map(a => a.id));
            const distinctNewAuthors = newAuthors.filter(a => !existingAuthorIds.has(a.id));
            return {
              ...prev,
              authors: [...prev.authors, ...distinctNewAuthors]
            };
          });

          setNewAuthorNames(prev => {
            const combined = [...prev, ...newSuggestedAuthors];
            return Array.from(new Set(combined));
          });
        }

        setSuggestedTagNames(result.suggestedTags ?? []);

      } catch (error) {
        console.error("Помилка аналізу:", error);
        toast.error("Не вдалося проаналізувати файл", {
          isCloseBtn: true,
        });
      } finally {
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
    <Box
      sx={{
        width: "900px",
        maxWidth: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
          padding: 4,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {/* Ліва частина: фото та файл */}
        <Box sx={{ width: { xs: "100%", md: 220 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CardMedia
            component="img"
            sx={{
              width: 180,
              height: 240,
              objectFit: "cover",
              borderRadius: 1,
              // background: "#eee",
            }}
            image={imagePreview || "https://placehold.co/180x240?text=No+Image"}
            alt="Book cover"
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 0.5 }}
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
              mt: 0.5,
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
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 0.5 }}
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
              mt: 0.5,
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
              variant="outlined"
              fullWidth
              sx={{ mt: 0.5 }}
              onClick={handleAnalyzeBook}
              disabled={analyzing}
            >
              {analyzing ? <LoadingIndicator minHeight={20} /> : "Аналізувати книгу"}
            </Button>
          )}
          {form.file && form.file.type === "application/pdf" && (
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 0.5 }}
              onClick={handleGenerateCover}
              disabled={generatingCover}
            >
              {generatingCover ? <LoadingIndicator minHeight={20} /> : "Звичайна обкладинка"}
            </Button>
          )}
        </Box>
        {/* Права частина: форма */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <DialogTitle
            sx={{
              p: 0,
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
          <form onSubmit={handleSubmit}>
            <TextField
              label="Назва"
              fullWidth
              margin="normal"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Опис"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={form.info}
              onChange={(e) => setForm({ ...form, info: e.target.value })}
            />
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
            <Button
              type="submit"
              variant="outlined"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              sx={{ marginTop: 2, height: 48 }}
            >
              {isSubmitting ? <LoadingIndicator minHeight={24} /> : (initialData ? "Оновити книгу" : "Додати книгу")}
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default BookForm;