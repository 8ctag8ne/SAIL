import { useState } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { login } from "../Api/Account";
import { useAuth } from "../Contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
      alert("Login failed");
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
          Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }}>
            Login
          </Button>
        </form>
        <Button
          variant="text"
          color="secondary"
          sx={{ marginTop: 2 }}
          onClick={() => navigate("/register")}
        >
          Don't have an account? Register
        </Button>
      </Paper>
    </Box>
  );
}