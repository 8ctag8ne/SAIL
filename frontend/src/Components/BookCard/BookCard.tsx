import React, { useState } from "react";
import { Card, CardContent, CardMedia, Typography, Box, Button, Chip, IconButton } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import { useNavigate } from "react-router-dom";
import { deleteBook, toggleLike } from "../../Api/BookApi";
import { useAuth } from "../../Contexts/AuthContext";
import BASE_URL from "../../config";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { SimpleAuthor, SimpleTag } from "../../types";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useLocation } from "react-router-dom";

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
const BookCard: React.FC<BookCardProps> = ({ id, title, imageUrl, info, tags, likesCount, isLiked, authors = [], }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Отримуємо інформацію про авторизацію
  const [liked, setLiked] = useState(isLiked || false);
  const [likeCount, setLikeCount] = useState(likesCount || 0);

  const handleClick = () => {
    navigate(`/books/${id}`);
  };

  const handleTagClick = (tagId: number) => {
    navigate(`/tags/${tagId}`); // Перехід на сторінку тегу
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Запобігає переходу на сторінку книги
    if (!user) {
      navigate("/login"); // Якщо користувач не авторизований, перенаправляємо на сторінку логіну
      return;
    }

    // Локальне оновлення стану
    setLiked((prevLiked) => !prevLiked);
    setLikeCount((prevCount) => (liked ? prevCount - 1 : prevCount + 1));

    try {
      await toggleLike(id); // Надсилаємо запит на сервер
    } catch (error) {
      console.error("Failed to toggle like:", error);

      // Відкат локального стану у разі помилки
      setLiked((prevLiked) => !prevLiked);
      setLikeCount((prevCount) => (liked ? prevCount + 1 : prevCount - 1));
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/books/edit/${id}`, { state: { from: location.pathname } });
    };

    const handleAuthorClick = (e: React.MouseEvent, authorId: number) => {
      e.stopPropagation();
      navigate(`/authors/${authorId}`);
    };
  
    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this book?")) {
        try {
          await deleteBook(Number(id));
          alert("Book deleted successfully!");
          navigate("/");
        } catch (error) {
          console.error("Failed to delete book:", error);
          alert("Failed to delete book.");
        }
      }
    };
  
    const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");
  

  const fullImageUrl = imageUrl ? `${BASE_URL}${imageUrl}` : undefined;

  return (
    <Card
      onClick={handleClick}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 2,
        marginY: 2,
        cursor: "pointer",
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: 6 },
        marginX: "auto",
        position: "relative", // ← ДОДАНО
        overflow: "hidden",
      }}
    >
      {fullImageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: 150, height: 200, objectFit: "cover", marginRight: 2, borderRadius: 1, }}
          image={fullImageUrl}
          alt={title}
        />
      ) : (
        <Box
          sx={{
            width: 150,
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 2,
            background: "#eee",
            borderRadius: 1,
          }}
        >
          <MenuBookIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, position: "relative", overflow: "hidden", paddingBottom: "56px" /* Відступ для кнопки лайків */ }}>
        <Typography
      variant="h5"
      fontWeight="bold"
      gutterBottom
      sx={{
        maxWidth: { xs: "70%", sm: "80%", md: "85%" },
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </Typography>
        {authors.length > 0 && (
          <Typography variant="subtitle2" color="primary" sx={{ cursor: "pointer" }}>
            By{" "}
            {authors.map((a, idx) => (
              <span
                key={a.id}
                style={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={e => handleAuthorClick(e, a.id)}
              >
                {a.name}
                {idx < authors.length - 1 ? ", " : ""}
              </span>
            ))}
          </Typography>
        )}
        {info && (
  <Box
    sx={{
      maxHeight: MAX_INFO_HEIGHT,
      overflow: "hidden",
      position: "relative",
      maxWidth: "95%",
      mb: 1,
    }}
  >
    <Typography
      variant="body1"
      color="text.secondary"
      paragraph
      sx={{ whiteSpace: "pre-line" }}
    >
      {info}
    </Typography>
    {/* Fade effect if overflow */}
    <Box
      sx={{
        content: '""',
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 32,
        background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%)",
        pointerEvents: "none",
        display: info && info.split("\n").length > 6 ? "block" : "none",
      }}
    />
  </Box>
)}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", width: "95%", marginTop: 1 }}>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.title}
              clickable
              onClick={(e) => {
                e.stopPropagation(); // Запобігає переходу на сторінку книги
                handleTagClick(tag.id);
              }}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
        <Box sx={{ position: "absolute", bottom: 8, right: 8 }}>
          {likesCount !== undefined && (
            <IconButton
              onClick={handleLikeClick}
              color={liked ? "primary" : "default"}
            >
              {liked ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
              <Typography sx={{ ml: 0.5 }}>{likeCount}</Typography>
            </IconButton>
          )}
        </Box>
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
    </Card>
  );
};

export default BookCard;