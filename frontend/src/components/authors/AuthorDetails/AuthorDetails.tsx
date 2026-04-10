import React, { useState } from "react";
import { Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { Author } from "../../../types";
import PersonIcon from "@mui/icons-material/Person";
import EntityModal from "../../ui/EntityModal/EntityModal";
import AuthorForm from "../AuthorForm/AuthorForm";
import { useUpdateAuthor } from "../../../hooks/useAuthors";
import { toast } from "react-fox-toast";
import { useQueryClient } from "@tanstack/react-query";
import BaseEntityDetails from "../../ui/BaseEntityDetails";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";


type AuthorDetailsProps = {
  author: Author;
  onDelete: () => void;
};

const AuthorDetails: React.FC<AuthorDetailsProps> = ({ author, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: updateAuthorMutation } = useUpdateAuthor();

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: { name: string; info?: string; image?: File | null }) => {
    try {
      await updateAuthorMutation({ id: author.id, data: { name: data.name, info: data.info, image: data.image ?? undefined } });
      toast.success("Автора оновлено успішно!", {
        isCloseBtn: true,
      });
      // If there was a specific route like ["author", author.id], invalidate that too, 
      // though typically AuthorDetails refetches entirely or we invalidate the specific query name.
      // But author details page gets it directly right now, need to check that.
      setIsEditModalOpen(false);
      // We will refresh the page or reload the author, actually AuthorDetailsPage needs to be invalidated if we are using React Query there. Wait, AuthorDetailsPage uses `getAuthorById` manually. Let's do window.location.reload() for now or let the parent component handle it. Let's just reload.
      window.location.reload();
    } catch (error) {
      toast.error("Не вдалося оновити автора.", {
        isCloseBtn: true,
      });
    }
  };

  const menuActions: ActionItem[] = [];

  if (canEditOrDelete) {
    menuActions.push({
      label: "Редагувати",
      icon: <EditIcon />,
      onClick: handleEditClick,
    });
    menuActions.push({
      label: "Видалити",
      icon: <DeleteIcon />,
      onClick: onDelete,
      isDestructive: true,
    });
  }

  return (
    <>
      <BaseEntityDetails
        imageUrl={author.imageUrl}
        imageAspectRatio="1/1"
        imagePlaceholderIcon={<PersonIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />}
        title={
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ width: "100%", wordBreak: "break-word" }}
          >
            {author.name}
          </Typography>
        }
        description={
          author.info && (
            <Typography variant="body1" color="text.secondary" paragraph sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {author.info}
            </Typography>
          )
        }
        actions={<EntityActionMenu actions={menuActions} />}
      />

      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <AuthorForm
          initialData={{ name: author.name ?? "", info: author.info ?? undefined, image: author.imageUrl ?? undefined }}
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditModalOpen(false)}
        />
      </EntityModal>
    </>
  );
};

export default AuthorDetails;