import React, { useState } from "react";
import { Box, Typography, TextField, Button, Switch, FormControlLabel, IconButton } from "@mui/material";
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
            component="form"
            onSubmit={handleSubmit}
            sx={{
                bgcolor: "background.paper",
                p: 3,
                border: "1px solid #2d2f33",
                borderRadius: 0,
                position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {onClose && (
                <IconButton
                    onClick={onClose}
                    sx={{ position: "absolute", top: 8, right: 8 }}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            )}

            <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", fontFamily: "JetBrains Mono" }}>
                {initialData ? "Редагування списку" : "Створити список"}
            </Typography>

            <TextField
                label="Назва списку"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                variant="filled"
                sx={{
                    mb: 2,
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
                    mb: 2,
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
                sx={{ mb: 3 }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                {onClose && (
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{
                            borderRadius: 0,
                            fontFamily: "JetBrains Mono",
                        }}
                    >
                        Скасувати
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="outlined"
                    disabled={!title.trim() || isSubmitting}
                    sx={{
                        borderRadius: 0,
                        fontFamily: "JetBrains Mono",
                    }}
                >
                    {initialData ? "Зберегти" : "Створити"}
                </Button>
            </Box>
        </Box>
    );
};

export default BookListForm;
