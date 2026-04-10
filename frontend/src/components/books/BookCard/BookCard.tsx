import React, { useState } from "react";
import {
  Typography, Box,
  IconButton, Chip
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useToggleLike, useUpdateBook, useDeleteBook } from "../../../hooks/useBooks";
import { useAuth } from "../../../contexts/AuthContext";
import { SimpleAuthor, SimpleTag } from "../../../types";
import { toast } from "react-fox-toast";
import ConfirmDialog from "../../ui/ConfirmDialog";
import EntityModal from "../../ui/EntityModal/EntityModal";
import BookForm from "../BookForm/BookForm";
import { updateBook } from "../../../api/BookApi";
import { useQueryClient } from "@tanstack/react-query";
import { ThumbUp, ThumbUpOffAlt, Edit, Delete, MenuBook, Book, Download as DownloadIcon, PlaylistAdd as PlaylistAddIcon } from "@mui/icons-material";
import BaseEntityCard from "../../ui/BaseEntityCard/BaseEntityCard";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";
import AddBookToListsDialog from "../BookList/AddBookToListsDialog";
import BASE_URL from "../../../config";

type BookCardProps = {
  id: number;
  title: string;
  imageUrl?: string;
  info?: string;
  tags: SimpleTag[];
  likesCount?: number;
  isLiked?: boolean;
  fileUrl?: string;
  authors?: SimpleAuthor[];
};

const MAX_INFO_HEIGHT = 120;

const BookCard: React.FC<BookCardProps> = ({
  id, title, imageUrl, info, tags, fileUrl,
  likesCount = 0, isLiked = false, authors = [],
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likesCount);

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");
  const fullImageUrl = imageUrl ? imageUrl : null;

  const handleNavigate = () => navigate(`/books/${id}`);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [addToListsOpen, setAddToListsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutateAsync: toggleLikeMutation } = useToggleLike();
  const { mutateAsync: updateBookMutation } = useUpdateBook();
  const { mutateAsync: deleteBookMutation } = useDeleteBook();

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return navigate("/login");

    // Оптимістичне оновлення UI
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);

    try {
      await toggleLikeMutation(id);
    } catch {
      // Відкат у разі помилки
      setLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
      toast.error("Помилка при зміні лайку.", {
        isCloseBtn: true,
      });
    }
  };



  const handleTagClick = (e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();
    navigate(`/tags/${tagId}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: FormData) => {
    try {
      await updateBookMutation({ id, data: formData });
      toast.success("Книгу оновлено успішно!", {
        isCloseBtn: true,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити книгу.", {
        isCloseBtn: true,
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBookMutation(id);
      toast.success("Книга успішно видалена!", {
        isCloseBtn: true,
      });
      navigate("/");
    } catch (error) {
      console.error("Failed to delete book:", error);
      toast.error("Не вдалося видалити книгу.", {
        isCloseBtn: true,
      });
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleAuthorClick = (e: React.MouseEvent, authorId: number) => {
    e.stopPropagation();
    navigate(`/authors/${authorId}`);
  };

  const handleDownloadClick = () => {
    const link = document.createElement("a");
    link.href = `${BASE_URL}/api/book/${id}/download`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuActions: ActionItem[] = [];
  
  if (canEditOrDelete) {
    menuActions.push({
      label: "Редагувати",
      icon: <Edit />,
      onClick: () => setIsEditModalOpen(true),
    });
  }

  if (user) {
    menuActions.push({
      label: "Додати до списку",
      icon: <PlaylistAddIcon />,
      onClick: () => setAddToListsOpen(true),
    });
  }

  if (fileUrl) {
    menuActions.push({
      label: "Завантажити",
      icon: <DownloadIcon />,
      onClick: handleDownloadClick,
    });
  }

  if (canEditOrDelete) {
    menuActions.push({
      label: "Видалити",
      icon: <Delete />,
      onClick: () => setConfirmOpen(true),
      isDestructive: true,
    });
  }

  return (
    <>
      <BaseEntityCard
        onClick={handleNavigate}
        imageUrl={fullImageUrl}
        imagePlaceholderIcon={<MenuBook sx={{ fontSize: 64, color: "#bdbdbd" }} />}
        title={title}
        subtitle={
          authors.length > 0 ? (
            <Typography variant="subtitle2" color="primary">
              Авторство:{" "}
              {authors.map((a, idx) => (
                <React.Fragment key={a.id}>
                  <Box
                    component="span"
                    onClick={(e) => handleAuthorClick(e, a.id)}
                    sx={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      color: "primary.main",
                      transition: "all 0.1s ease-in-out",
                      "&:hover": {
                        backgroundColor: "primary.main",
                        color: "#0d0f12",
                        textDecoration: "none",
                      }
                    }}
                  >
                    [ {a.name} ]
                  </Box>
                  {idx < authors.length - 1 ? ", " : ""}
                </React.Fragment>
              ))}
            </Typography>
          ) : undefined
        }
        description={info}
        tags={
          tags.map(tag => (
              <Chip
                key={tag.id}
                label={
                  <Box component="span" sx={{ display: "inline-block", maxWidth: "40ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "bottom" }}>
                    {tag.title}
                  </Box>
                }
                clickable
                onClick={(e) => handleTagClick(e, tag.id)}
                sx={{
                  cursor: "pointer",
                  maxWidth: "100%",
                }}
              />
          ))
        }
        footer={
          likesCount !== undefined ? (
            <IconButton onClick={handleLikeToggle} color={liked ? "primary" : "default"}>
              {liked ? <ThumbUp /> : <ThumbUpOffAlt />}
              <Typography sx={{ ml: 0.5 }}>{likeCount}</Typography>
            </IconButton>
          ) : undefined
        }
        actions={<EntityActionMenu actions={menuActions} />}
      />

      {user && (
        <AddBookToListsDialog
          open={addToListsOpen}
          onClose={() => setAddToListsOpen(false)}
          bookId={id}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Ви впевнені, що хочете видалити цю книгу?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <BookForm
          initialData={{
            title: title,
            info: info ?? "",
            imageUrl: fullImageUrl ?? undefined,
            tags: tags,
            authors: authors,
          }}
          onSubmit={handleEditSubmit}
        />
      </EntityModal>
    </>
  );
};

export default BookCard;
