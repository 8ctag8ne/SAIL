import React, { useState } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { User } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import EntityModal from "../../ui/EntityModal/EntityModal";
import UserForm from "../UserForm/UserForm";
import ConfirmDialog from "../../ui/ConfirmDialog";
import BanUserForm from "../BanUserForm/BanUserForm";
import { toast } from "react-fox-toast";
import { editUser, setUserRole, deleteUser, banUser, unbanUser } from "../../../api/Account";
import { useQueryClient } from "@tanstack/react-query";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";

const getRoleIcon = (roles: string[]) => {
  if (roles.includes("Admin")) return <AdminPanelSettingsIcon color="error" sx={{ fontSize: 32 }} />;
  if (roles.includes("Librarian")) return <LibraryBooksIcon color="primary" sx={{ fontSize: 32 }} />;
  return <PersonIcon color="action" sx={{ fontSize: 32 }} />;
};

type Props = {
  user: User;
  showEdit?: boolean;
  onDeleted?: () => void;
  onUpdated?: () => void;
  isFirst?: boolean;
};

const UserCard: React.FC<Props> = ({ user, showEdit, onDeleted, onUpdated, isFirst }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes("Admin");

  const isOwner = currentUser?.id === user.id;
  const canEditOrDelete = showEdit && (isAdmin || isOwner);
  const canBan = isAdmin && !user.roles.includes("Admin") && currentUser?.id !== user.id;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isUnbanConfirmOpen, setIsUnbanConfirmOpen] = useState(false);
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

  const handleBanConfirm = async (reason: string) => {
    try {
      await banUser(user.id, reason);
      toast.success(`Користувача ${user.userName} заблоковано!`, {
        isCloseBtn: true,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsBanModalOpen(false);
      onUpdated?.();
    } catch (error) {
      toast.error("Не вдалося заблокувати користувача.", {
        isCloseBtn: true,
      });
    }
  };

  const handleUnbanConfirm = async () => {
    try {
      await unbanUser(user.id);
      toast.success(`Користувача ${user.userName} успішно розблоковано!`, {
        isCloseBtn: true,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsUnbanConfirmOpen(false);
      onUpdated?.();
    } catch (error) {
      toast.error("Не вдалося розблокувати користувача.", {
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
  }

  if (canBan) {
    if (user.isBanned) {
      menuActions.push({
        label: "Розблокувати",
        icon: <LockOpenIcon />,
        onClick: () => setIsUnbanConfirmOpen(true),
      });
    } else {
      menuActions.push({
        label: "Заблокувати",
        icon: <BlockIcon />,
        onClick: () => setIsBanModalOpen(true),
        isDestructive: true,
      });
    }
  }

  if (canEditOrDelete) {
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
      sx={{
        my: 2,
        cursor: "pointer",
        maxWidth: 400,
        mx: "auto",
        position: "relative",
      }}
      onClick={() => navigate(`/users/${user.id}`)}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {getRoleIcon(user.roles)}
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h6" noWrap>{user.userName}</Typography>
            {user.isBanned && (
              <Chip
                label="ЗАБЛОКОВАНО"
                color="error"
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 0,
                  fontSize: "0.65rem",
                  height: 18,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "bold",
                }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
          {user.isBanned && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Причина: {user.banReason || "Порушення правил спільноти"}
            </Typography>
          )}
        </Box>
        {menuActions.length > 0 && (
          <Box sx={{ ml: "auto" }}>
            <EntityActionMenu actions={menuActions} menuClassName={isFirst ? "tour-user-card-menu" : undefined} />
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

      <EntityModal open={isBanModalOpen} onClose={() => setIsBanModalOpen(false)}>
        <BanUserForm
          userName={user.userName}
          onSubmit={handleBanConfirm}
          onClose={() => setIsBanModalOpen(false)}
        />
      </EntityModal>

      <ConfirmDialog
        open={isUnbanConfirmOpen}
        title={`Розблокувати користувача ${user.userName}?`}
        confirmColor="primary"
        confirmText="Розблокувати"
        onConfirm={handleUnbanConfirm}
        onCancel={() => setIsUnbanConfirmOpen(false)}
      />

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