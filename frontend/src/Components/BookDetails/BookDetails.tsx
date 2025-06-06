import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import BookIcon from "@mui/icons-material/Book";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import BASE_URL from "../../config";
import { SimpleAuthor, SimpleTag } from "../../types";
import { deleteBook, downloadBookFile, toggleLike } from "../../Api/BookApi";
import { useAuth } from "../../Contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddBookToListsDialog from "../BookList/AddBookToListsDialog";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useLocation } from "react-router-dom";
import { toast } from "react-fox-toast";

type BookDetailsProps = {
  title: string;
  imageUrl?: string;
  info?: string;
  tags: SimpleTag[];
  fileUrl?: string;
  likesCount?: number;
  isLiked?: boolean;
  authors?: SimpleAuthor[];
};
const MAX_INFO_HEIGHT = 140; // px, ~6-7 рядків
const BookDetails: React.FC<BookDetailsProps> = ({
  title,
  imageUrl,
  info,
  tags,
  fileUrl,
  likesCount,
  isLiked,
  authors = [],
}) => {
  const fullImageUrl = imageUrl ? `${BASE_URL}${imageUrl}` : undefined;
  const { id } = useParams(); // Отримуємо ID з URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  const [showReadMore, setShowReadMore] = useState(false);
  const infoRef = React.useRef<HTMLDivElement>(null);

  const [liked, setLiked] = useState(isLiked || false);
  const [likeCount, setLikeCount] = useState(likesCount || 0);
  const [addToListsOpen, setAddToListsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  React.useEffect(() => {
    if (infoRef.current) {
      setShowReadMore(infoRef.current.scrollHeight > MAX_INFO_HEIGHT);
    }
  }, [info, expanded]);

  const handleTagClick = (tagId: number) => {
    navigate(`/tags/${tagId}`);
  };

  const handleAuthorClick = (authorId: number) => {
    navigate(`/authors/${authorId}`);
  };

  const handleLikeClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      await toggleLike(Number(id));
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    }
  };

  const handleEditClick = () => {
    navigate(`/books/edit/${id}`, { state: { from: location.pathname } });
  };

  const handleDeleteClick = async () => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await deleteBook(Number(id));
        toast.success("Book deleted successfully!");
        navigate("/");
      } catch (error) {
        console.error("Failed to delete book:", error);
        toast.error("Failed to delete book.");
      }
    }
  };

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");


  return (
    <Card sx={{ display: "flex", flexDirection: "row", margin: "20px auto", padding: 2 }}>
      <Box sx={{ flex: "0 0 255px", marginRight: 2 }}>
        {fullImageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: "100%", height: "340px", objectFit: "cover", marginRight: 2, borderRadius: 1, }}
          image={fullImageUrl}
          alt={title}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "340px",
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
        {fileUrl && (
          <Box sx={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<BookIcon />}
              href={`${BASE_URL}${fileUrl}`}
              target="_blank"
              sx={{ width: "100%" }}
            >
              Читати
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DownloadIcon />}
              sx={{ width: "100%" }}
              component="a"
              href={`${BASE_URL}/api/book/${id}/download`}
              download
            >
              Завантажити
            </Button>
          </Box>
        )}
        <AddBookToListsDialog
          open={addToListsOpen}
          onClose={() => setAddToListsOpen(false)}
          bookId={Number(id)}
        />
      </Box>
      <CardContent sx={{ flex: 1, position: "relative" }}>
        <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        sx={{
          wordBreak: "break-word", // Додає перенос слів, якщо дуже довга назва
          pr: canEditOrDelete ? 10 : 0,
        }}
      >
        {title}
      </Typography>
        {authors.length > 0 && (
          <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
            Авторство:{" "}
            {authors.map((a, idx) => (
              <span
                key={a.id}
                style={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={() => handleAuthorClick(a.id)}
              >
                {a.name}
                {idx < authors.length - 1 ? ", " : ""}
              </span>
            ))}
          </Typography>
        )}
        {info && (
          <Box sx={{ position: "relative", mb: 2 }}>
            <Typography
              ref={infoRef}
              variant="body1"
              color="text.secondary"
              paragraph
              sx={{
                whiteSpace: "pre-line",
                maxHeight: !expanded && showReadMore ? `${MAX_INFO_HEIGHT}px` : "none",
                overflow: !expanded && showReadMore ? "hidden" : "visible",
                textOverflow: !expanded && showReadMore ? "ellipsis" : "unset",
                display: "-webkit-box",
                WebkitLineClamp: !expanded && showReadMore ? 7 : "unset",
                WebkitBoxOrient: "vertical",
                pr: 3,
              }}
            >
              {info}
              {/* Додаємо ... якщо обрізано */}
              {!expanded && showReadMore && (
                <Box component="span" sx={{ color: "text.secondary" }}>...</Box>
              )}
            </Typography>
          </Box>
        )}
        {/* Кнопка читати більше/менше під описом */}
        {info && showReadMore && (
          <Button
            size="small"
            sx={{
              mb: 2,
              px: 1,
              minWidth: "unset",
              fontSize: 14,
              display: "block",
            }}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Читати менше" : "Читати більше"}
          </Button>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", marginBottom: 2 }}>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.title}
              clickable
              onClick={() => handleTagClick(tag.id)}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
        <Box sx={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 1 }}>
          <IconButton
            onClick={handleLikeClick}
            color={liked ? "primary" : "default"}
          >
            {liked ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
            <Typography sx={{ ml: 0.5 }}>{likeCount}</Typography>
          </IconButton>
          {user && (<IconButton
            onClick={() => setAddToListsOpen(true)}
            color="default"
            aria-label="add to lists"
          >
            <PlaylistAddIcon />
          </IconButton>)}
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

export default BookDetails;
