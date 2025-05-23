import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia } from "@mui/material";
import { SimpleBook } from "../../types";
import BookSearchMultiSelect from "../BookSearchMultiSelect/BookSearchMultiSelect";
import BASE_URL from "../../config";

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
    initialData?.imageUrl ? `${BASE_URL}${initialData.imageUrl}` : undefined
  );

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        info: initialData.info || "",
        image: null,
        books: initialData.books || [],
      });
      if (initialData.imageUrl) {
        setImagePreview(`${BASE_URL}${initialData.imageUrl}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title: form.title,
      info: form.info,
      image: form.image,
      bookIds: form.books.map((b) => b.id),
    });
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start", minHeight: "100vh", backgroundColor: "#f5f5f5", py: 4 }}>
      <Paper elevation={3} sx={{ display: "flex", flexDirection: "row", gap: 4, padding: 4, minWidth: 600 }}>
        {/* Ліва частина: фото */}
        <Box sx={{ width: 220, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
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
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {imagePreview && !form.image && initialData?.imageUrl && "Current image"}
            {form.image && form.image.name}
          </Typography>
        </Box>
        {/* Права частина: форма */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            {initialData ? "Edit Tag" : "Add Tag"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Title"
              fullWidth
              margin="normal"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <TextField
              label="Info"
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
              sx={{ marginTop: 2 }}
            >
              {initialData ? "Update Tag" : "Add Tag"}
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default TagForm;