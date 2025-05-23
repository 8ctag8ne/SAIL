import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, editUser, setUserRole } from "../Api/Account";
import { User } from "../types";
import { Box, TextField, Button, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useAuth } from "../Contexts/AuthContext";

const ROLES = ["User", "Librarian", "Admin"];

const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ userName: "", email: "", about: "", phoneNumber: "" });
  const [role, setRole] = useState<string>("User");

  useEffect(() => {
    if (id) {
      getUserById(id).then((u) => {
        const user = u as User;
        setUser(user);
        setForm({
          userName: user.userName || "",
          email: user.email || "",
          about: user.about || "",
          phoneNumber: user.phoneNumber || "",
        });
        setRole(user.roles.includes("Admin") ? "Admin" : user.roles.includes("Librarian") ? "Librarian" : "User");
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!id) return;
    await editUser(id, form);
    if (currentUser?.roles.includes("Admin") && role !== (user?.roles[0] || "User")) {
      await setUserRole(id, role);
    }
    navigate(`/users/${id}`);
  };

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <Paper sx={{ maxWidth: 500, mx: "auto", mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>Edit User</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="Username" name="userName" value={form.userName} onChange={handleChange} />
        <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
        <TextField label="About" name="about" value={form.about} onChange={handleChange} multiline minRows={2} />
        <TextField label="Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        {currentUser?.roles.includes("Admin") && (
          <FormControl>
            <InputLabel>Role</InputLabel>
            <Select value={role} label="Role" onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button variant="contained" onClick={handleSave}>Save</Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default EditUserPage;