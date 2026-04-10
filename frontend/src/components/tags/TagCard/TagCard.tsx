import React from "react";
import { Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { Tag } from "../../../types";
import BASE_URL from "../../../config";
import { useAuth } from "../../../contexts/AuthContext";
import { useUpdateTag, useDeleteTag, useTag } from "../../../hooks/useTags";
import LoadingIndicator from "../../ui/LoadingIndicator";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { toast } from "react-fox-toast";
import EntityModal from "../../ui/EntityModal/EntityModal";
import ConfirmDialog from "../../ui/ConfirmDialog";
import TagForm from "../TagForm/TagForm";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import BaseEntityCard from "../../ui/BaseEntityCard/BaseEntityCard";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";

type TagCardProps = {
  tag: Tag;
};

const TagCard: React.FC<TagCardProps> = ({ tag }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: updateTagMutation } = useUpdateTag();
  const { mutateAsync: deleteTagMutation } = useDeleteTag();
  const { data: fullTag, isLoading: isLoadingFullTag } = useTag(isEditModalOpen ? tag.id : 0);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: { title: string; info?: string; image?: File | null; bookIds: number[] }) => {
    try {
      await updateTagMutation({ id: tag.id, data: { title: data.title, info: data.info, image: data.image ?? undefined, bookIds: data.bookIds } });
      toast.success("Тег оновлено успішно!", {
        isCloseBtn: true,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити тег.", {
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
      await deleteTagMutation(tag.id);
      toast.success("Тег видалений успішно!", {
        isCloseBtn: true,
      });
      navigate("/tags");
    } catch (error) {
      toast.error("Не вдалося видалити тег.", {
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
        onClick={() => navigate(`/tags/${tag.id}`)}
        imageUrl={tag.imageUrl}
        imagePlaceholderIcon={<LocalOfferIcon sx={{ fontSize: 48, color: "#bdbdbd" }} />}
        title={tag.title}
        description={tag.info}
        footer={
          <Typography variant="caption" color="text.secondary">
            Книги: {tag.booksCount}
          </Typography>
        }
        actions={<EntityActionMenu actions={menuActions} />}
      />

      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        {isLoadingFullTag ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <LoadingIndicator />
          </Box>
        ) : fullTag ? (
          <TagForm
            key={isEditModalOpen ? "open" : "closed"}
            initialData={{
              title: fullTag.title ?? "",
              info: fullTag.info ?? undefined,
              imageUrl: fullTag.imageUrl ?? undefined,
              books: fullTag.books,
            }}
            onSubmit={handleEditSubmit}
          />
        ) : null}
      </EntityModal>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Ви впевнені, що хочете видалити цей тег?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </>
  );
};

export default TagCard;