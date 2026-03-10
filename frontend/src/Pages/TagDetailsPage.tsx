import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTagById } from "../api/TagApi";
import { Tag } from "../types";
import { useUpdateTag, useDeleteTag } from "../hooks/useTags";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import BooksPageComponent from "../components/books/BooksPageComponent/BooksPageComponent";
import { Card, CardContent, CardMedia, Typography, Box, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../contexts/AuthContext";
import BASE_URL from "../config";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { toast } from "react-fox-toast";
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

  return (
    <PageContainer>
      <Card sx={{ display: "flex", flexDirection: "row", margin: "20px auto", padding: 2 }}>
        {tag.imageUrl ? (
          <CardMedia
            component="img"
            sx={{ width: 200, height: 200, objectFit: "cover", marginRight: 2 }}
            image={tag.imageUrl}
            alt={tag.title || "Tag"}
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
            <LocalOfferIcon sx={{ fontSize: 48, color: "#bdbdbd" }} />
          </Box>
        )}
        <CardContent sx={{ flex: 1, position: "relative" }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {tag.title}
          </Typography>
          {tag.info && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {tag.info}
            </Typography>
          )}
          {canEditOrDelete && (
            <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
              <IconButton color="primary" onClick={handleEditClick}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </CardContent>
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
          />
        </EntityModal>
        <ConfirmDialog
          open={isDeleteConfirmOpen}
          title="Ви впевнені, що хочете видалити цей тег?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      </Card>
      <Typography variant="h5" gutterBottom>
        Книги з тегом "{tag.title}":
      </Typography>
      <BooksPageComponent queryParams={{ TagIds: [Number(id)] }} />
    </PageContainer>
  );
};

export default TagDetailsPage;