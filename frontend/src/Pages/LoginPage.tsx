import { useState } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { login } from "../api/Account";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { showApiError } from "../utils/apiError";

export default function LoginPage() {
  const [form, setForm] = useState({ id: "", userName: "", password: "" });
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(form); // API має повернути { token, username, roles }
      doLogin(response.token, { id: response.id, username: response.userName, roles: response.roles });
      navigate("/");
    } catch (err: any) {
      showApiError(err, "Логін не вдався. Перевірте ім'я користувача та пароль.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 160px)",
        backgroundColor: "transparent",
        py: 3,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 2.5, sm: 4 },
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Логін
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Ім'я користувача"
            fullWidth
            margin="normal"
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
          />
          <TextField
            label="Пароль"
            type="password"
            fullWidth
            margin="normal"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" variant="outlined" color="primary" fullWidth sx={{ marginTop: 2 }}>
            Вхід
          </Button>
        </form>
        <Button
          variant="text"
          color="secondary"
          sx={{ marginTop: 2 }}
          onClick={() => navigate("/register")}
        >
          Не маєте акаунту? Зареєструйтесь
        </Button>
      </Paper>
    </Box>
  );
}