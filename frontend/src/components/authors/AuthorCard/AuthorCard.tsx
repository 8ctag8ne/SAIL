import React, { useState } from "react";
import { Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useUpdateAuthor, useDeleteAuthor } from "../../../hooks/useAuthors";
import { AuthorCardProps } from "../../../types";
import PersonIcon from "@mui/icons-material/Person";
import { toast } from "react-fox-toast";
import EntityModal from "../../ui/EntityModal/EntityModal";
import ConfirmDialog from "../../ui/ConfirmDialog";
import AuthorForm from "../AuthorForm/AuthorForm";
import { useQueryClient } from "@tanstack/react-query";
import BaseEntityCard from "../../ui/BaseEntityCard/BaseEntityCard";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";

const AuthorCard: React.FC<AuthorCardProps> = ({ author }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: updateAuthorMutation } = useUpdateAuthor();
  const { mutateAsync: deleteAuthorMutation } = useDeleteAuthor();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: { name: string; info?: string; image?: File | null }) => {
    try {
      await updateAuthorMutation({ id: author.id, data: { name: data.name, info: data.info, image: data.image ?? undefined } });
      toast.success("Автора оновлено успішно!", {
        isCloseBtn: true,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити автора.", {
        isCloseBtn: true,
      });
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAuthorMutation(author.id);
      toast.success("Автор успішно видалений!", {
        isCloseBtn: true,
      });
      navigate("/authors");
    } catch (error) {
      toast.error("Не вдалося видалити автора.", {
        isCloseBtn: true,
      });
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

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
    <>
      <BaseEntityCard
        onClick={() => navigate(`/authors/${author.id}`)}
        imageUrl={author.imageUrl}
        imageAspectRatio="1/1"
        imagePlaceholderIcon={<PersonIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />}
        title={author.name}
        description={author.info}
        actions={<EntityActionMenu actions={menuActions} />}
      />

      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <AuthorForm
          initialData={{ name: author.name ?? "", info: author.info ?? undefined, image: author.imageUrl ?? undefined }}
          onSubmit={handleEditSubmit}
        />
      </EntityModal>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Ви впевнені, що хочете видалити цього автора?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </>
  );
};

export default AuthorCard;