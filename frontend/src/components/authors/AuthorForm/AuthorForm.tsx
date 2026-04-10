import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Typography, Paper, CardMedia, IconButton, DialogTitle } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";

type AuthorFormProps = {
  initialData?: {
    name: string;
    info?: string;
    image?: string | null;
  };
  onSubmit: (data: { name: string; info?: string; image: File | null }) => Promise<void>;
  onClose?: () => void;
};

const AuthorForm: React.FC<AuthorFormProps> = ({ initialData, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    info: initialData?.info || "",
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initialData?.image ? initialData.image : undefined
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
      setImagePreview(initialData?.image ? initialData.image : undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
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
          padding: 4,
          width: "100%",
          maxWidth: 700,
        }}
      >
        <form onSubmit={handleSubmit}>
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
              {initialData ? "Редагувати автора" : "Додати автора"}
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
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
            }}
          >
            {/* Ліва частина: фото */}
            <Box sx={{ width: { xs: "100%", md: 220 }, display: "flex", flexDirection: "column", gap: 2 }}>
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
                alt="Author photo"
              />
              <Button
                variant="outlined"
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
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <TextField
                label="Ім'я"
                fullWidth
                margin="none"
                sx={{ mb: 2 }}
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
                variant="outlined"
                color="primary"
                fullWidth
                disabled={isSubmitting}
                sx={{ marginTop: 2, height: 48 }}
              >
                {isSubmitting ? <LoadingIndicator minHeight={24} /> : (initialData ? "Оновити автора" : "Додати автора")}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AuthorForm;