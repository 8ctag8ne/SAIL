import React, { useState } from "react";
import {
  Card, CardContent, CardMedia, Typography, Box,
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
import { ThumbUp, ThumbUpOffAlt, Edit, Delete, MenuBook, Book } from "@mui/icons-material";

type BookCardProps = {
  id: number;
  title: string;
  imageUrl?: string;
  info?: string;
  tags: SimpleTag[];
  likesCount?: number;
  isLiked?: boolean;
  authors?: SimpleAuthor[];
};

const MAX_INFO_HEIGHT = 120;

const BookCard: React.FC<BookCardProps> = ({
  id, title, imageUrl, info, tags,
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

  return (
    <Card
      className="MuiCard-interactive"
      onClick={handleNavigate}
      sx={{
        display: "flex", flexDirection: "row", alignItems: "center",
        padding: 2, marginY: 2, marginX: "auto",
        position: "relative", overflow: "hidden",
      }}
    >
      <ConfirmDialog
        open={confirmOpen}
        title="Ви впевнені, що хочете видалити цю книгу?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      {fullImageUrl ? (
        <CardMedia
          component="img"
          image={fullImageUrl}
          alt={title}
          sx={{ width: 150, height: 200, objectFit: "cover", marginRight: 2, borderRadius: 1 }}
        />
      ) : (
        <Box sx={{
          width: 150, height: 200, background: "#eee", marginRight: 2,
          display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1
        }}>
          <MenuBook sx={{ fontSize: 64, color: "#bdbdbd" }} />
        </Box>
      )}

      <CardContent sx={{
        flex: 1,
        position: "relative",
        paddingBottom: "56px",
        minHeight: 200, // ← або інше значення
        overflow: "hidden"
      }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom
          sx={{
            maxWidth: { xs: "70%", sm: "80%", md: "85%" },
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
          {title}
        </Typography>

        {authors.length > 0 && (
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
        )}

        {info && (
          <Box sx={{
            maxHeight: MAX_INFO_HEIGHT, overflow: "hidden",
            position: "relative", maxWidth: "95%", mb: 1,
          }}>
            <Typography
              variant="body1"
              color="text.secondary"
              paragraph
              sx={{
                whiteSpace: "pre-line",
                wordBreak: "break-word", // ← важливо!
                maxWidth: "100%"         // ← обмеження ширини
              }}
            >
              {info}
            </Typography>
            <Box sx={{
              position: "absolute", left: 0, right: 0, bottom: 0, height: 32,
              background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%)",
              pointerEvents: "none", display: info.split("\n").length > 6 ? "block" : "none"
            }} />
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", width: "95%", mt: 1 }}>
          {tags.map(tag => (
            <Chip
              key={tag.id}
              label={tag.title}
              clickable
              onClick={(e) => handleTagClick(e, tag.id)}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>

        {likesCount !== undefined && (
          <Box sx={{ position: "absolute", bottom: 8, right: 8 }}>
            <IconButton onClick={handleLikeToggle} color={liked ? "primary" : "default"}>
              {liked ? <ThumbUp /> : <ThumbUpOffAlt />}
              <Typography sx={{ ml: 0.5 }}>{likeCount}</Typography>
            </IconButton>
          </Box>
        )}

        {canEditOrDelete && (
          <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
            <IconButton color="primary" onClick={handleEditClick}>
              <Edit />
            </IconButton>
            <IconButton color="error" onClick={handleDeleteClick}>
              <Delete />
            </IconButton>
          </Box>
        )}
      </CardContent>

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
    </Card>
  );
};

export default BookCard;
