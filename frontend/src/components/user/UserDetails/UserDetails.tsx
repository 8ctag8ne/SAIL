import React, { useState } from "react";
import { Card, CardContent, Typography, Box, Accordion, AccordionSummary, AccordionDetails, Chip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { User } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import EntityModal from "../../ui/EntityModal/EntityModal";
import UserForm from "../UserForm/UserForm";
import ConfirmDialog from "../../ui/ConfirmDialog";
import BanUserForm from "../BanUserForm/BanUserForm";
import { toast } from "react-fox-toast";
import { showApiError } from "../../../utils/apiError";
import { editUser, setUserRole, deleteUser, banUser, unbanUser } from "../../../api/Account";
import { useQueryClient } from "@tanstack/react-query";

const getRoleIcon = (roles: string[]) => {
  if (roles.includes("Admin")) return <AdminPanelSettingsIcon color="error" sx={{ fontSize: 40 }} />;
  if (roles.includes("Librarian")) return <LibraryBooksIcon color="primary" sx={{ fontSize: 40 }} />;
  return <PersonIcon color="action" sx={{ fontSize: 40 }} />;
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

const UserDetails: React.FC<Props> = ({ user, showEdit = true, onDeleted, onUpdated }) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isUnbanConfirmOpen, setIsUnbanConfirmOpen] = useState(false);

  const isAdmin = currentUser?.roles?.includes("Admin");
  const isOwner = currentUser?.id === user.id;
  const canEditOrDelete = showEdit && (isAdmin || isOwner);
  const canBan = isAdmin && !user.roles.includes("Admin") && currentUser?.id !== user.id;

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
      toast.success("Дані користувача оновлено успішно!", { isCloseBtn: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onUpdated?.();
      setIsEditModalOpen(false);
    } catch (error) {
      showApiError(error, "Не вдалося оновити дані.");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(user.id);
      toast.success("Користувача видалено успішно!", { isCloseBtn: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDeleteConfirmOpen(false);
      onDeleted?.();
    } catch (error) {
      showApiError(error, "Не вдалося видалити користувача.");
    }
  };

  const handleBanConfirm = async (reason: string) => {
    try {
      await banUser(user.id, reason);
      toast.success(`Користувача ${user.userName} заблоковано!`, { isCloseBtn: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsBanModalOpen(false);
      onUpdated?.();
    } catch (error) {
      showApiError(error, "Не вдалося заблокувати користувача.");
    }
  };

  const handleUnbanConfirm = async () => {
    try {
      await unbanUser(user.id);
      toast.success(`Користувача ${user.userName} успішно розблоковано!`, { isCloseBtn: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsUnbanConfirmOpen(false);
      onUpdated?.();
    } catch (error) {
      showApiError(error, "Не вдалося розблокувати користувача.");
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

  const hasAdditionalInfo = !!user.about || !!user.phoneNumber;

  return (
    <Card sx={{ position: "relative" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          {getRoleIcon(user.roles)}
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>{user.userName}</Typography>
              {user.isBanned && (
                <Chip
                  label="ЗАБЛОКОВАНО"
                  color="error"
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 0,
                    fontSize: "0.7rem",
                    height: 22,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: "bold",
                  }}
                />
              )}
            </Box>
            <Typography variant="body1" color="text.secondary">{user.email}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Роль: <b>{getHighestRole(user.roles)}</b>
            </Typography>
            {user.isBanned && (
              <Box sx={{ mt: 1, p: 1, borderLeft: "2px solid #ff5252", bgcolor: "rgba(255, 82, 82, 0.05)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Причина блокування: <b>{user.banReason || "Порушення правил спільноти"}</b>
                </Typography>
                {user.bannedAt && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                    Дата: {new Date(user.bannedAt).toLocaleString("uk-UA")}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          {menuActions.length > 0 && (
            <Box>
              <EntityActionMenu actions={menuActions} />
            </Box>
          )}
        </Box>

        {hasAdditionalInfo && (
          <Accordion disableGutters elevation={0} sx={{ mt: 2, "&:before": { display: "none" }, bgcolor: "transparent" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 1, minHeight: 0, "& .MuiAccordionSummary-content": { my: 1 } }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">Додаткова інформація</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1, pt: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              {user.about && (
                <Box>
                  <Typography variant="caption" color="text.disabled">Про себе</Typography>
                  <Typography variant="body2">{user.about}</Typography>
                </Box>
              )}
              {user.phoneNumber && (
                <Box>
                  <Typography variant="caption" color="text.disabled">Телефон</Typography>
                  <Typography variant="body2">{user.phoneNumber}</Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
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

export default UserDetails;
