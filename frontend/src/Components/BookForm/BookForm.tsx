import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia, CircularProgress, IconButton, Stack } from "@mui/material";
import TagMultiSelect from "../TagMultiSelect/TagMultiSelect";
import { SimpleAuthor, SimpleTag } from "../../types";
import SingleAuthorSelect from "../SingleAuthorSelect/SingleAuthorSelect";
import BASE_URL from "../../config";
import { renderPdfFirstPage, analyzeBookPdf } from "../../Api/FileApi";
import TagNameMultiInput from "../TagNameMultiInput/TagNameMultiInput";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

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
};

const BookForm: React.FC<BookFormProps> = ({ initialData, onSubmit }) => {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    info: initialData?.info || "",
    image: null as File | null,
    file: null as File | null,
    tags: initialData?.tags || ([] as SimpleTag[]),
    authors: initialData?.authors || ([] as SimpleAuthor[]), // ОНОВЛЕНО
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [authorSearch, setAuthorSearch] = useState<string[]>(form.authors.map(a => a.name) || [""]);
  const [suggestedTagNames, setSuggestedTagNames] = useState<string[]>([]);

  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initialData?.imageUrl ? `${BASE_URL}${initialData.imageUrl}` : undefined
  );
  const [fileName, setFileName] = useState<string>(
    initialData?.fileUrl ? initialData.fileUrl.split("/").pop() || "" : ""
  );
  const [generatingCover, setGeneratingCover] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        title: initialData.title || "",
        info: initialData.info || "",
        tags: initialData.tags || [],
        authors: initialData.authors || [],
      }));
      setAuthorSearch(initialData.authors?.map(a => a.name) || [""]);
      if (initialData.imageUrl) {
        setImagePreview(`${BASE_URL}${initialData.imageUrl}`);
      }
      if (initialData.fileUrl) {
        setFileName(initialData.fileUrl.split("/").pop() || "");
      }
    }
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, image: file }));
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
    setFileName(file ? file.name : "");

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
    if (form.file && form.file.type === "application/pdf") {
      setAnalyzing(true);
      try {
        const result = await analyzeBookPdf(form.file);
        setForm((prev) => ({
          ...prev,
          title: result.title,
          info: result.description,
          tags: result.existingTags,
          // Не підставляємо авторів напряму!
        }));
        // Якщо є автор — підставляємо його у перший елемент пошуку
        if (Array.isArray(result.authors) && result.authors.length > 0) {
          setAuthorSearch(result.authors.map(a => a.name || ""));
          setForm((prev) => ({
            ...prev,
            authors: result.authors.map(a =>
              a.id && a.name ? { id: a.id, name: a.name } : { id: 0, name: a.name || "" }
            ),
          }));
        } else {
          setAuthorSearch([""]);
          setForm((prev) => ({ ...prev, authors: [{ id: 0, name: "" }] }));
        }
        setSuggestedTagNames(result.suggestedTags ?? []);
      } catch (err) {
        // handle error
      }
      setAnalyzing(false);
    }
  };

  // Додаємо нового автора (пустий селектор)
  const handleAddAuthor = () => {
    setForm((prev) => ({
      ...prev,
      authors: [...prev.authors, { id: 0, name: "" } as SimpleAuthor],
    }));
    setAuthorSearch((prev) => [...prev, ""]);
  };

  // Видаляємо автора
  const handleRemoveAuthor = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== idx),
    }));
    setAuthorSearch((prev) => prev.filter((_, i) => i !== idx));
  };

  // Оновлення автора
  const handleAuthorChange = (idx: number, author: SimpleAuthor | null) => {
    if (!author) return;
    setForm((prev) => ({
      ...prev,
      authors: prev.authors.map((a, i) => (i === idx ? author : a)),
    }));
  };

  // Оновлення пошуку автора
  const handleAuthorSearchChange = (idx: number, value: string) => {
    setAuthorSearch((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validAuthors = form.authors.filter(Boolean) as SimpleAuthor[];
    if (!validAuthors.length) {
      alert("Please select at least one author!");
      return;
    }
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("info", form.info);
    validAuthors.forEach((a) => formData.append("AuthorIds", a.id.toString()));
    if (form.image) formData.append("image", form.image);
    if (form.file) formData.append("file", form.file);
    form.tags.forEach((tag) => formData.append("TagIds", tag.id.toString()));
    suggestedTagNames.forEach((tagName) => formData.append("NewTagTitles", tagName));

    await onSubmit(formData);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 4,
          padding: 4,
          maxWidth: 1200,
          minWidth: 0,
        }}
      >
        {/* Ліва частина: фото та файл */}
        <Box sx={{ width: 220, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CardMedia
            component="img"
            sx={{
              width: 180,
              height: 240,
              objectFit: "cover",
              borderRadius: 1,
              background: "#eee",
            }}
            image={imagePreview || "https://placehold.co/180x240?text=No+Image"}
            alt="Book cover"
          />
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mt: 1 }}
          >
            Upload Image
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
              mt: 1,
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {imagePreview && !form.image && initialData?.imageUrl && "Current image"}
            {form.image && form.image.name}
          </Typography>
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mt: 2 }}
          >
            Upload File
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
              mt: 1,
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {fileName && `File: ${fileName}`}
          </Typography>
          {form.file && form.file.type === "application/pdf" && (
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 1 }}
              onClick={handleAnalyzeBook}
              disabled={analyzing}
            >
              {analyzing ? <CircularProgress size={20} /> : "Аналізувати книгу"}
            </Button>
          )}
          {form.file && form.file.type === "application/pdf" && (
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 1 }}
              onClick={handleGenerateCover}
              disabled={generatingCover}
            >
              {generatingCover ? <CircularProgress size={20} /> : "Default cover"}
            </Button>
          )}
        </Box>
        {/* Права частина: форма */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            {initialData ? "Edit Book" : "Add Book"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Title"
              fullWidth
              margin="normal"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Info"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={form.info}
              onChange={(e) => setForm({ ...form, info: e.target.value })}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Authors
            </Typography>
            <Stack spacing={1}>
              {form.authors.map((author, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", }}>
                  <Box sx={{ flex: 1 }}>
                    <SingleAuthorSelect
                      selectedAuthor={author}
                      onChange={(a) => handleAuthorChange(idx, a)}
                      searchValue={authorSearch[idx] || ""}
                      onSearchChange={(val) => handleAuthorSearchChange(idx, val)}
                    />
                  </Box>
                  <IconButton
                    aria-label="remove author"
                    color="error"
                    onClick={() => handleRemoveAuthor(idx)}
                    size="small"
                    sx={{ mt: 1 }}
                    disabled={form.authors.length === 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ mt: 1, mb: 2 }}
              onClick={handleAddAuthor}
              disabled={form.authors.length >= 5}
            >
              Додати автора
            </Button>
            <TagMultiSelect
              selectedTags={form.tags || []}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
            <TagNameMultiInput
              tagNames={suggestedTagNames ?? []}
              onChange={setSuggestedTagNames}
              label="Suggested tags"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
            >
              {initialData ? "Update Book" : "Add Book"}
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default BookForm;