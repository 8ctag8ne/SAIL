import { useState } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { login } from "../Api/Account";
import { useAuth } from "../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-fox-toast";

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
    } catch (err) {
      toast.error("Логін не вдався. Перевірте ім'я користувача та пароль.");
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
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }}>
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