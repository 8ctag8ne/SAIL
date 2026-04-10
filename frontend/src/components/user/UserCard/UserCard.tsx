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
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { toast } from "react-fox-toast";
import { editUser, setUserRole, deleteUser } from "../../../api/Account";
import { useQueryClient } from "@tanstack/react-query";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";

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
  onDeleted?: () => void;
  onUpdated?: () => void;
};

const UserCard: React.FC<Props> = ({ user, showEdit, onDeleted, onUpdated }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes("Admin");

  const isOwner = currentUser?.id === user.id;
  const canEditOrDelete = showEdit && (isAdmin || isOwner);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
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
      toast.success("Дані користувача оновлено успішно!", {
        isCloseBtn: true,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onUpdated?.();
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити дані.", {
        isCloseBtn: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(user.id);
      toast.success("Користувача видалено успішно!", {
        isCloseBtn: true,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDeleteConfirmOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error("Не вдалося видалити користувача.", {
        isCloseBtn: true,
      });
    }
  };

  const menuActions: ActionItem[] = [];

  if (canEditOrDelete) {
    menuActions.push({
      label: "Редагувати",
      icon: <EditIcon />,
      onClick: () => setIsEditModalOpen(true),
    });
    menuActions.push({
      label: "Видалити",
      icon: <DeleteIcon />,
      onClick: () => setIsDeleteConfirmOpen(true),
      isDestructive: true,
    });
  }

  return (
    <Card
      className="MuiCard-interactive"
      sx={{ my: 2, cursor: "pointer", maxWidth: 400, mx: "auto", position: "relative" }}
      onClick={() => navigate(`/users/${user.id}`)}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {getRoleIcon(user.roles)}
        <Box>
          <Typography variant="h6">{user.userName}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          <Typography variant="body2" color="text.secondary">
            Роль: <b>{getHighestRole(user.roles)}</b>
          </Typography>
          {user.about && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {user.about}
            </Typography>
          )}
          {user.phoneNumber && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Телефон: {user.phoneNumber}
            </Typography>
          )}
        </Box>
        {menuActions.length > 0 && (
          <Box sx={{ ml: "auto" }}>
            <EntityActionMenu actions={menuActions} />
          </Box>
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
          onClose={() => setIsEditModalOpen(false)}
        />
      </EntityModal>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Ви впевнені, що хочете видалити цього користувача?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </Card>
  );
};

export default UserCard;