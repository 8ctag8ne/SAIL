import React, { useState } from "react";
import { Box, Typography, TextField, Button, Switch, FormControlLabel, IconButton, DialogTitle } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { BookList, BookListCreate } from "../../../types";
import { toast } from "react-fox-toast";

type BookListFormProps = {
    initialData?: BookList;
    onSubmit: (data: BookListCreate) => Promise<void>;
    onClose?: () => void;
};

const BookListForm: React.FC<BookListFormProps> = ({ initialData, onSubmit, onClose }) => {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate ?? false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                title,
                description,
                isPrivate,
                bookIds: initialData?.books?.map(b => b.id) || [],
            });
            toast.success("Список успішно створений!", {
                isCloseBtn: true,
            });
        } catch (error) {
            toast.error("Не вдалося створити список.", {
                isCloseBtn: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
    <Box
      sx={{
        width: 500,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        border: "1px solid #2d2f33",
        borderRadius: 0,
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
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
          <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: "JetBrains Mono" }}>
            {initialData ? "Редагування списку" : "Створити список"}
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
            flexDirection: "column",
            gap: 2,
            flex: 1,
            overflowY: "auto",
          }}
        >
          <TextField
            label="Назва списку"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            variant="filled"
            sx={{
              "& .MuiInputBase-root": {
                borderRadius: 0,
                fontFamily: "JetBrains Mono",
              },
            }}
            autoFocus
          />

          <TextField
            label="Опис списку"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            variant="filled"
            sx={{
              "& .MuiInputBase-root": {
                borderRadius: 0,
                fontFamily: "JetBrains Mono",
              },
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography sx={{ fontFamily: "JetBrains Mono" }}>
                Приватний список
              </Typography>
            }
          />

          <Button
            type="submit"
            variant="outlined"
            fullWidth
            disabled={!title.trim() || isSubmitting}
            sx={{
              borderRadius: 0,
              fontFamily: "JetBrains Mono",
              height: 48,
              flexShrink: 0,
              mt: 1
            }}
          >
            {initialData ? "Зберегти" : "Створити"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default BookListForm;
