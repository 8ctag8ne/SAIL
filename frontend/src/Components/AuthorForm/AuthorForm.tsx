import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia } from "@mui/material";
import BASE_URL from "../../config";

type AuthorFormProps = {
  initialData?: {
    name: string;
    info?: string;
    image?: string | null;
  };
  onSubmit: (data: { name: string; info?: string; image: File | null }) => Promise<void>;
};

const AuthorForm: React.FC<AuthorFormProps> = ({ initialData, onSubmit }) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    info: initialData?.info || "",
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initialData?.image ? `${BASE_URL}${initialData.image}` : undefined
  );

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        info: initialData.info || "",
        image: null,
      });
      if (initialData.image) {
        setImagePreview(`${BASE_URL}${initialData.image}`);
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
    await onSubmit(form);
  };

  return (
    <Box
      sx={{
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
          minWidth: 600,
        }}
      >
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
            alt="Author photo"
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
            {imagePreview && !form.image && initialData?.image && "Current image"}
            {form.image && form.image.name}
          </Typography>
        </Box>
        {/* Права частина: форма */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            {initialData ? "Редагувати автора" : "Додати автора"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Ім'я"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              label="Інформація"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={form.info}
              onChange={(e) => setForm({ ...form, info: e.target.value })}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
            >
              {initialData ? "Оновити автора" : "Додати автора"}
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthorForm;