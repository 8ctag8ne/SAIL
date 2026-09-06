import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia, IconButton, DialogTitle } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SimpleBook } from "../../../types";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import EntityListSelector from "../../ui/EntityListSelector";
import { useBooks } from "../../../hooks/useBooks";

type TagFormProps = {
  initialData?: {
    title: string;
    info?: string;
    imageUrl?: string;
    books?: SimpleBook[];
  };
  onSubmit: (data: { title: string; info?: string; image: File | null; bookIds: number[] }) => Promise<void>;
  onClose?: () => void;
};

const TagForm: React.FC<TagFormProps> = ({ initialData, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    info: initialData?.info || "",
    image: null as File | null,
    books: initialData?.books || ([] as SimpleBook[]),
  });

  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initialData?.imageUrl ?? undefined
  );

  const [searchQuery, setSearchQuery] = useState("");
  const { data: booksData, isLoading: isLoadingBooks } = useBooks({ PageSize: 1000 });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: form.title,
        info: form.info,
        image: form.image,
        bookIds: form.books.map((b) => b.id),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBook = (book: SimpleBook) => {
    setForm(prev => {
      const isSelected = prev.books.some(b => b.id === book.id);
      return {
        ...prev,
        books: isSelected
          ? prev.books.filter(b => b.id !== book.id)
          : [...prev.books, book]
      };
    });
  };

  const allBooks = booksData?.items || [];
  const filteredBooks = allBooks.filter(b =>
    (b.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Paper
      elevation={3}
      sx={{
        width: 800,
        maxWidth: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 0,
        boxSizing: "border-box",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ШАПКА: Жорстко зафіксована зверху */}
        <DialogTitle
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            backgroundColor: "background.paper",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {initialData ? "Редагувати тег" : "Додати тег"}
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary", mr: -0.5, p: 0.5 }}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>

        {/* ТІЛО ФОРМИ: ЄДИНЕ місце, де є скролбар */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, md: 4 },
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {/* Ліва частина: фото */}
          <Box sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <CardMedia
              component="img"
              sx={{
                width: "100%",
                aspectRatio: "1/1",
                objectFit: "cover",
                borderRadius: 1,
                background: "#eee",
              }}
              image={imagePreview || "https://placehold.co/180x180?text=No+Image"}
              alt="Tag image"
            />
            <Button variant="outlined" component="label" fullWidth>
              Завантажити фото
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {imagePreview && !form.image && initialData?.imageUrl && "Поточне зображення"}
              {form.image && form.image.name}
            </Typography>
          </Box>

          {/* Права частина: форма */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Назва"
              fullWidth
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <TextField
              label="Інформація"
              fullWidth
              multiline
              rows={3}
              value={form.info}
              onChange={(e) => setForm({ ...form, info: e.target.value })}
            />

            {/* Селектор: без зайвих маніпуляцій з minHeight/overflow */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <EntityListSelector
                items={filteredBooks}
                loading={isLoadingBooks}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Пошук книг..."
                keyExtractor={(book) => book.id}
                isItemSelected={(book) => form.books.some(b => b.id === book.id)}
                onToggleItem={handleToggleBook}
                renderItem={(book) => (
                  <Typography variant="body1">
                    {book.title}
                  </Typography>
                )}
              />
            </Box>

            {/* Кнопка: просто лежить внизу правої колонки */}
            <Button
              type="submit"
              variant="outlined"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              sx={{ height: 48, flexShrink: 0, mt: 1 }}
            >
              {isSubmitting ? <LoadingIndicator minHeight={24} /> : (initialData ? "Оновити тег" : "Додати тег")}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default TagForm;