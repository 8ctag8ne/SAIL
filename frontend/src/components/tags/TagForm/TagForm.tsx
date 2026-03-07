import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia } from "@mui/material";
import { SimpleBook } from "../../../types";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import BookSearchMultiSelect from "../../search/BookSearchMultiSelect/BookSearchMultiSelect";
import BASE_URL from "../../../config";

type TagFormProps = {
  initialData?: {
    title: string;
    info?: string;
    imageUrl?: string;
    books?: SimpleBook[];
  };
  onSubmit: (data: { title: string; info?: string; image: File | null; bookIds: number[] }) => Promise<void>;
};

const TagForm: React.FC<TagFormProps> = ({ initialData, onSubmit }) => {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    info: initialData?.info || "",
    image: null as File | null,
    books: initialData?.books || ([] as SimpleBook[]),
  });

  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initialData?.imageUrl ?? undefined
  );

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

  return (
    <Box
      sx={{
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
          maxWidth: 800,
          height: "100%",
          maxHeight: 600,
        }}
      >
        {/* Ліва частина: фото */}
        <Box sx={{ width: { xs: "100%", md: 220 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CardMedia
            component="img"
            sx={{
              width: 180,
              height: 180,
              objectFit: "cover",
              borderRadius: 1,
              background: "#eee",
            }}
            image={imagePreview || "https://placehold.co/180x180?text=No+Image"}
            alt="Tag image"
          />
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mt: 1 }}
          >
            Завантажити фото
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {imagePreview && !form.image && initialData?.imageUrl && "Поточне зображення"}
            {form.image && form.image.name}
          </Typography>
        </Box>
        {/* Права частина: форма */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            {initialData ? "Редагувати тег" : "Додати тег"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Назва"
              fullWidth
              margin="normal"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <TextField
              label="Інформація"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={form.info}
              onChange={(e) => setForm({ ...form, info: e.target.value })}
            />
            <BookSearchMultiSelect
              selectedBooks={form.books}
              onChange={(books) => setForm((prev) => ({ ...prev, books }))}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              sx={{ marginTop: 2, height: 48 }}
            >
              {isSubmitting ? <LoadingIndicator minHeight={24} /> : (initialData ? "Оновити тег" : "Додати тег")}
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default TagForm;