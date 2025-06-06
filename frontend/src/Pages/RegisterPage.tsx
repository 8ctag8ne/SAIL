import { useState } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { register, login } from "../Api/Account"; // Імпортуємо login
import { useAuth } from "../Contexts/AuthContext"; // Використовуємо AuthContext
import { useNavigate } from "react-router-dom";
import { toast } from "react-fox-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ id: "", userName: "", email: "", password: "" });
  const { login: doLogin } = useAuth(); // Отримуємо функцію login із контексту
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Реєстрація користувача
      await register(form);

      // Логін після реєстрації
      const response = await login({ id: form.id, userName: form.userName, password: form.password }); // API має повернути { token, username, roles }
      doLogin(response.token, { id: form.id, username: response.userName, roles: response.roles });

      // Перенаправлення на головну сторінку
      navigate("/");
    } catch (err) {
      toast.error("Реєстрація не вдалась. Перевірте дані та спробуйте ще раз.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: 400,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Реєстрація
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Ім'я користувача"
            fullWidth
            margin="normal"
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Пароль"
            type="password"
            fullWidth
            margin="normal"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }}>
            Зареєструватися
          </Button>
        </form>
        <Button
          variant="text"
          color="secondary"
          sx={{ marginTop: 2 }}
          onClick={() => navigate("/login")}
        >
          Уже маєте акаунт? Увійдіть
        </Button>
      </Paper>
    </Box>
  );
}