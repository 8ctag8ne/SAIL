import React, { useState } from "react";
import {
  Card, CardContent, CardMedia, Typography, Box,
  IconButton, Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { ThumbUp, ThumbUpOffAlt, Edit, Delete, MenuBook } from "@mui/icons-material";
import { deleteBook, toggleLike } from "../../Api/BookApi";
import { useAuth } from "../../Contexts/AuthContext";
import { SimpleAuthor, SimpleTag } from "../../types";
import BASE_URL from "../../config";
import { toast } from "react-fox-toast";
import ConfirmDialog from "../ConfirmDialog";

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
  const fullImageUrl = imageUrl ? `${BASE_URL}${imageUrl}` : null;

  const handleNavigate = () => navigate(`/books/${id}`);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return navigate("/login");

    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);

    try {
      await toggleLike(id);
    } catch {
      setLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
      toast.error("Помилка при зміні лайку.");
    }
  };

  

  const handleTagClick = (e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();
    navigate(`/tags/${tagId}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/books/edit/${id}`, { state: { from: location.pathname } });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  setConfirmOpen(true);
};

const handleConfirmDelete = async () => {
  try {
    await deleteBook(Number(id));
    toast.success("Книга успішно видалена!");
    navigate("/");
  } catch (error) {
    console.error("Failed to delete book:", error);
    toast.error("Не вдалося видалити книгу.");
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
      onClick={handleNavigate}
      sx={{
        display: "flex", flexDirection: "row", alignItems: "center",
        padding: 2, marginY: 2, marginX: "auto",
        cursor: "pointer", boxShadow: 2, "&:hover": { boxShadow: 6 },
        position: "relative", overflow: "hidden"
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
              <span
                key={a.id}
                onClick={(e) => handleAuthorClick(e, a.id)}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                {a.name}{idx < authors.length - 1 ? ", " : ""}
              </span>
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
    </Card>
  );
};

export default BookCard;
