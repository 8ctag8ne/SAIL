import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTagById } from "../api/TagApi";
import { Tag } from "../types";
import { useUpdateTag, useDeleteTag } from "../hooks/useTags";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import BooksPageComponent from "../components/books/BooksPageComponent/BooksPageComponent";
import { Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../contexts/AuthContext";
import BASE_URL from "../config";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { toast } from "react-fox-toast";
import BaseEntityDetails from "../components/ui/BaseEntityDetails";
import EntityActionMenu, { ActionItem } from "../components/ui/EntityActionMenu";
import EntityModal from "../components/ui/EntityModal/EntityModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import TagForm from "../components/tags/TagForm/TagForm";
import { useQueryClient } from "@tanstack/react-query";


const TagDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: updateTagMutation } = useUpdateTag();
  const { mutateAsync: deleteTagMutation } = useDeleteTag();

  useEffect(() => {
    const fetchTag = async () => {
      try {
        if (id) {
          const tagData = await getTagById(Number(id));
          setTag(tagData);
        }
      } catch (error) {
        console.error("Failed to fetch tag:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTag();
  }, [id]);

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: { title: string; info?: string; image?: File | null; bookIds: number[] }) => {
    try {
      await updateTagMutation({ id: Number(id), data: { title: data.title, info: data.info, image: data.image ?? undefined, bookIds: data.bookIds } });
      toast.success("Тег оновлено успішно!", {
        isCloseBtn: true,
      });
      // Reload to get new tag details since it's fetched directly via useEffect here
      setIsEditModalOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error("Не вдалося оновити тег.", {
        isCloseBtn: true,
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (id) {
        await deleteTagMutation(Number(id));
        toast.success("тег видалений успішно!", {
          isCloseBtn: true,
        });
        navigate("/tags");
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("не вдалося видалити тег.", {
        isCloseBtn: true,
      });
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!tag) {
    return <Typography>Тег не знайдений.</Typography>;
  }

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
      onClick: handleDelete,
      isDestructive: true,
    });
  }

  return (
    <PageContainer>
      <BaseEntityDetails
        imageUrl={tag.imageUrl}
        imageAspectRatio="1/1"
        imagePlaceholderIcon={<LocalOfferIcon sx={{ fontSize: 48 }} />}
        title={
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ width: "100%", wordBreak: "break-word" }}
          >
            {tag.title}
          </Typography>
        }
        description={
          tag.info && (
            <Typography variant="body1" color="text.secondary" paragraph sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {tag.info}
            </Typography>
          )
        }
        actions={<EntityActionMenu actions={menuActions} />}
      />
      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <TagForm
          key={isEditModalOpen ? "open" : "closed"}
          initialData={{
            title: tag.title ?? "",
            info: tag.info ?? undefined,
            imageUrl: tag.imageUrl ?? undefined,
            books: tag.books,
          }}
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditModalOpen(false)}
        />
      </EntityModal>
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Ви впевнені, що хочете видалити цей тег?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
      <Typography variant="h5" gutterBottom sx={{ wordBreak: "break-word" }}>
        Книги з тегом "{tag.title}":
      </Typography>
      <BooksPageComponent queryParams={{ TagIds: [Number(id)] }} />
    </PageContainer>
  );
};

export default TagDetailsPage;