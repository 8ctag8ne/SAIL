import React, { useState } from "react";
import { Card, CardContent, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { User } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import EntityModal from "../../ui/EntityModal/EntityModal";
import UserForm from "../UserForm/UserForm";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { toast } from "react-fox-toast";
import { editUser, setUserRole, deleteUser } from "../../../api/Account";
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

const UserDetails: React.FC<Props> = ({ user, showEdit, onDeleted, onUpdated }) => {
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
      toast.success("Дані користувача оновлено успішно!", { isCloseBtn: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onUpdated?.();
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити дані.", { isCloseBtn: true });
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
      toast.error("Не вдалося видалити користувача.", { isCloseBtn: true });
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

  const hasAdditionalInfo = !!user.about || !!user.phoneNumber;

  return (
    <Card sx={{ position: "relative" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          {getRoleIcon(user.roles)}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>{user.userName}</Typography>
            <Typography variant="body1" color="text.secondary">{user.email}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Роль: <b>{getHighestRole(user.roles)}</b>
            </Typography>
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
