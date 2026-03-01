import React, { useState } from "react";
import { Card, CardContent, CardMedia, Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useUpdateAuthor, useDeleteAuthor } from "../../../hooks/useAuthors";
import BASE_URL from "../../../config";
import { Author, AuthorCardProps } from "../../../types";
import PersonIcon from "@mui/icons-material/Person";
import { toast } from "react-fox-toast";
import EntityModal from "../../ui/EntityModal/EntityModal";
import ConfirmDialog from "../../ui/ConfirmDialog";
import AuthorForm from "../AuthorForm/AuthorForm";
import { useQueryClient } from "@tanstack/react-query";

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
      toast.success("Автора оновлено успішно!");
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити автора.");
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAuthorMutation(author.id);
      toast.success("Author deleted successfully!");
      navigate("/authors");
    } catch (error) {
      console.error("Failed to delete author:", error);
      toast.error("Failed to delete author.");
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  return (
    <Card
      onClick={() => navigate(`/authors/${author.id}`)}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 2,
        marginY: 1,
        cursor: "pointer",
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: 6 },
      }}
    >
      {author.imageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: 150, height: 150, objectFit: "cover", marginRight: 2, borderRadius: 1, }}
          image={author.imageUrl}
          alt={author.name || "Author"}
        />
      ) : (
        <Box
          sx={{
            width: 150,
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 2,
            background: "#eee",
            borderRadius: 1,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, position: "relative" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {author.name}
        </Typography>
        {author.info && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {author.info}
          </Typography>
        )}
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
    </Card>
  );
};

export default AuthorCard;