import React from "react";
import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import { User } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import EntityModal from "../../ui/EntityModal/EntityModal";
import UserForm from "../UserForm/UserForm";
import { useState } from "react";
import { toast } from "react-fox-toast";
import { editUser, setUserRole } from "../../../api/Account";
import { useQueryClient } from "@tanstack/react-query";

const getRoleIcon = (roles: string[]) => {
  if (roles.includes("Admin")) return <AdminPanelSettingsIcon color="error" sx={{ fontSize: 32 }} />;
  if (roles.includes("Librarian")) return <LibraryBooksIcon color="primary" sx={{ fontSize: 32 }} />;
  return <PersonIcon color="action" sx={{ fontSize: 32 }} />;
};

const getHighestRole = (roles: string[]): string => {
  if (roles.includes("Admin")) return "Адміністратор";
  if (roles.includes("Librarian")) return "Бібліотекар";
  return "Користувач";
};

type Props = {
  user: User;
  showEdit?: boolean;
};

const UserCard: React.FC<Props> = ({ user, showEdit }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes("Admin");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleEditSubmit = async (data: { userName: string; email: string; about: string; phoneNumber: string; role: string }) => {
    try {
      await editUser(user.id, {
        userName: data.userName,
        email: data.email,
        about: data.about,
        phoneNumber: data.phoneNumber
      });
      if (isAdmin && data.role !== (user.roles[0] || "User")) {
        await setUserRole(user.id, data.role);
      }
      toast.success("Дані користувача оновлено успішно!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити дані.");
    }
  };

  return (
    <Card sx={{ my: 2, cursor: "pointer", maxWidth: 400, mx: "auto", position: "relative" }} onClick={() => navigate(`/users/${user.id}`)}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {getRoleIcon(user.roles)}
        <Box>
          <Typography variant="h6">{user.userName}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          <Typography variant="body2" color="text.secondary">
            Роль: <b>{getHighestRole(user.roles)}</b>
          </Typography>
        </Box>
        {showEdit && isAdmin && (
          <IconButton
            color="primary"
            sx={{ ml: "auto" }}
            onClick={e => {
              e.stopPropagation();
              setIsEditModalOpen(true);
            }}
          >
            <EditIcon />
          </IconButton>
        )}
      </CardContent>

      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <UserForm
          initialData={{
            userName: user.userName || "",
            email: user.email || "",
            about: user.about || "",
            phoneNumber: user.phoneNumber || "",
            role: user.roles.includes("Admin") ? "Admin" : user.roles.includes("Librarian") ? "Librarian" : "User"
          }}
          onSubmit={handleEditSubmit}
        />
      </EntityModal>
    </Card>
  );
};

export default UserCard;