import React from "react";
import { Card, CardContent, CardMedia, Typography, Box, IconButton } from "@mui/material";
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

  return (
    <Card
      className="MuiCard-interactive"
      onClick={() => navigate(`/tags/${tag.id}`)}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 2,
        marginY: 2,
      }}
    >
      {tag.imageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: "cover", marginRight: 2 }}
          image={tag.imageUrl}
          alt={tag.title || "Tag"}
        />
      ) : (
        <Box
          sx={{
            width: 120,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 2,
            background: "#eee",
            borderRadius: 1,
          }}
        >
          <LocalOfferIcon sx={{ fontSize: 48, color: "#bdbdbd" }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, position: "relative" }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {tag.title}
        </Typography>
        {tag.info && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {tag.info}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Книги: {tag.booksCount}
        </Typography>
        {canEditOrDelete && (
          <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
            <IconButton color="primary" onClick={handleEditClick}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={handleDeleteClick}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </CardContent>

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
    </Card>
  );
};

export default TagCard;