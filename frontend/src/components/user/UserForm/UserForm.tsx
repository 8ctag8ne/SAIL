import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Paper, FormControl, InputLabel, Select, MenuItem, IconButton, DialogTitle } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";

const ROLES = ["User", "Librarian", "Admin"];

type UserFormProps = {
    initialData: {
        userName: string;
        email: string;
        about: string;
        phoneNumber: string;
        role: string;
    };
    onSubmit: (data: { userName: string; email: string; about: string; phoneNumber: string; role: string }) => Promise<void>;
    onClose?: () => void;
};

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onClose }) => {
    const { user: currentUser } = useAuth();

    const [form, setForm] = useState({
        userName: initialData.userName || "",
        email: initialData.email || "",
        about: initialData.about || "",
        phoneNumber: initialData.phoneNumber || "",
    });
    const [role, setRole] = useState<string>(initialData.role || "User");
    const [isSubmitting, setIsSubmitting] = useState(false);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ ...form, role });
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
                    flexDirection: "column",
                    gap: 2,
                    padding: 4,
                    width: "100%",
                    maxWidth: 500,
                }}
            >
                <DialogTitle
                    sx={{
                        p: 0,
                        mb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h6" fontWeight="bold">Редагувати користувача</Typography>
                    {onClose && (
                        <IconButton
                            onClick={onClose}
                            sx={{ color: "text.secondary", mr: -1 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <TextField label="Ім'я" name="userName" value={form.userName} onChange={handleChange} required fullWidth />
                    <TextField label="Email" name="email" value={form.email} onChange={handleChange} required fullWidth type="email" />
                    <TextField label="Інформація" name="about" value={form.about} onChange={handleChange} multiline minRows={3} fullWidth />
                    <TextField label="Номер телефону" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} fullWidth />

                    {currentUser?.roles.includes("Admin") && (
                        <FormControl fullWidth>
                            <InputLabel>Роль</InputLabel>
                            <Select value={role} label="Роль" onChange={e => setRole(e.target.value)}>
                                {ROLES.map(r => (
                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <Button
                        type="submit"
                        variant="outlined"
                        color="primary"
                        fullWidth
                        disabled={isSubmitting}
                        sx={{ marginTop: 2, height: 48 }}
                    >
                        {isSubmitting ? <LoadingIndicator minHeight={24} /> : "Зберегти"}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default UserForm;
