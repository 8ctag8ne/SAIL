import React from "react";
import { Card, CardContent, CardMedia, Typography, Box, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import BASE_URL from "../../../config";
import { Author } from "../../../types";
import PersonIcon from "@mui/icons-material/Person";
import EntityModal from "../../ui/EntityModal/EntityModal";
import AuthorForm from "../AuthorForm/AuthorForm";
import { useState } from "react";
import { updateAuthor } from "../../../api/AuthorApi";
import { toast } from "react-fox-toast";
import { useQueryClient } from "@tanstack/react-query";


type AuthorDetailsProps = {
  author: Author;
  onDelete: () => void;
};

const AuthorDetails: React.FC<AuthorDetailsProps> = ({ author, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: { name: string; info?: string; image?: File | null }) => {
    try {
      await updateAuthor(author.id, { name: data.name, info: data.info, image: data.image ?? undefined });
      toast.success("Автора оновлено успішно!");
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      // If there was a specific route like ["author", author.id], invalidate that too, 
      // though typically AuthorDetails refetches entirely or we invalidate the specific query name.
      // But author details page gets it directly right now, need to check that.
      setIsEditModalOpen(false);
      // We will refresh the page or reload the author, actually AuthorDetailsPage needs to be invalidated if we are using React Query there. Wait, AuthorDetailsPage uses `getAuthorById` manually. Let's do window.location.reload() for now or let the parent component handle it. Let's just reload.
      window.location.reload();
    } catch (error) {
      toast.error("Не вдалося оновити автора.");
    }
  };

  return (
    <Card sx={{ display: "flex", flexDirection: "row", margin: "20px auto", padding: 2 }}>
      {author.imageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: 200, height: 200, objectFit: "cover", marginRight: 2, borderRadius: 1, }}
          image={author.imageUrl}
          alt={author.name || "Author"}
        />
      ) : (
        <Box
          sx={{
            width: 200,
            height: 200,
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
        <Typography variant="h4" fontWeight="bold" gutterBottom>
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
            <IconButton color="error" onClick={onDelete}>
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
    </Card>
  );
};

export default AuthorDetails;