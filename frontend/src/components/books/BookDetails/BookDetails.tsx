import React, { useState } from "react";
import {
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import BaseEntityDetails from "../../ui/BaseEntityDetails";
import DownloadIcon from "@mui/icons-material/Download";
import BookIcon from "@mui/icons-material/Book";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import BASE_URL from "../../../config";
import { SimpleAuthor, SimpleTag } from "../../../types";
import { downloadBookFile } from "../../../api/BookApi";
import { useToggleLike, useUpdateBook, useDeleteBook } from "../../../hooks/useBooks";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import EntityModal from "../../ui/EntityModal/EntityModal";
import ConfirmDialog from "../../ui/ConfirmDialog";
import BookForm from "../BookForm/BookForm";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";
import AddBookToListsDialog from "../BookList/AddBookToListsDialog";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RagIndexDialog from "./RagIndexDialog";
import MarkdownEditorModal from "./MarkdownEditorModal";
import { useLocation } from "react-router-dom";
import { toast } from "react-fox-toast";
import { useQueryClient } from "@tanstack/react-query";

type BookDetailsProps = {
  title: string;
  imageUrl?: string;
  info?: string;
  tags: SimpleTag[];
  fileUrl?: string;
  likesCount?: number;
  isLiked?: boolean;
  authors?: SimpleAuthor[];
  parsed?: boolean;
  processed?: boolean;
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
  parsed,
  processed,
}) => {
  const fullImageUrl = imageUrl ?? undefined;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRagIndexOpen, setIsRagIndexOpen] = useState(false);
  const [isMarkdownEditorOpen, setIsMarkdownEditorOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const { mutateAsync: toggleLikeMutation } = useToggleLike();
  const { mutateAsync: updateBookMutation } = useUpdateBook();
  const { mutateAsync: deleteBookMutation } = useDeleteBook();

  const handleLikeClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      await toggleLikeMutation(Number(id));
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    }
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: FormData) => {
    try {
      await updateBookMutation({ id: Number(id), data: formData });
      toast.success("Книга оновлена успішно!", {
        isCloseBtn: true,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Не вдалося оновити книгу.", {
        isCloseBtn: true,
      });
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBookMutation(Number(id));
      toast.success("Книга успішно видалена!", {
        isCloseBtn: true,
      });
      navigate("/");
    } catch (error) {
      toast.error("Не вдалося видалити книгу.", {
        isCloseBtn: true,
      });
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const isAdmin = user?.roles.includes("Admin");
  const canEditOrDelete = isAdmin || user?.roles.includes("Librarian");

  const menuActions: ActionItem[] = [];

  if (canEditOrDelete) {
    menuActions.push({
      label: "Редагувати",
      icon: <EditIcon />,
      onClick: handleEditClick,
    });
  }

  if (user) {
    menuActions.push({
      label: "Додати до списку",
      icon: <PlaylistAddIcon />,
      onClick: () => setAddToListsOpen(true),
    });
  }

  if (isAdmin) {
    if (parsed) {
      menuActions.push({
        label: processed ? "Оновити RAG-індекс" : "Згенерувати RAG-індекс",
        icon: <AutoAwesomeIcon />,
        onClick: (e?: React.MouseEvent) => {
          if (e) e.stopPropagation();
          setIsRagIndexOpen(true);
        },
      });
    }
    menuActions.push({
      label: parsed ? "Редагувати Markdown" : "Переглянути/Аналізувати текст",
      icon: <BookIcon />,
      onClick: () => setIsMarkdownEditorOpen(true),
    });
  }

  if (canEditOrDelete) {
    menuActions.push({
      label: "Видалити",
      icon: <DeleteIcon />,
      onClick: handleDeleteClick,
      isDestructive: true,
    });
  }

  return (
    <>
      <BaseEntityDetails
        imageWidth={255}
        imageAspectRatio="1/1.414"
        imageUrl={fullImageUrl}
        imagePlaceholderIcon={<MenuBookIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />}
        leftColumnAppend={
          <>
            {fileUrl && (
              <Box sx={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  className="tour-read-button"
                  variant="outlined"
                  color="primary"
                  startIcon={<BookIcon />}
                  href={fileUrl}
                  target="_blank"
                  sx={{ width: "100%" }}
                >
                  Читати
                </Button>
                <Button
                  className="tour-download-button"
                  variant="outlined"
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
          </>
        }
        title={
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{
              width: "100%",
              wordBreak: "break-word",
            }}
          >
            {title}
          </Typography>
        }
        subtitle={
          authors.length > 0 && (
            <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
              Авторство:{" "}
              {authors.map((a, idx) => (
                <React.Fragment key={a.id}>
                  <Box
                    component="span"
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAuthorClick(a.id);
                    }}
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
          )
        }
        description={
          <>
            {info && (
              <Box sx={{ position: "relative", mb: 2 }}>
                <Typography
                  ref={infoRef}
                  variant="body1"
                  color="text.secondary"
                  paragraph
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
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
                  {!expanded && showReadMore && (
                    <Box component="span" sx={{ color: "text.secondary" }}>...</Box>
                  )}
                </Typography>
              </Box>
            )}
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
          </>
        }
        tags={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", marginBottom: 2 }}>
            {tags.map((tag) => (
              <Chip
                key={tag.id}
                label={
                  <Box component="span" sx={{ display: "inline-block", maxWidth: "40ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "bottom" }}>
                    {tag.title}
                  </Box>
                }
                clickable
                onClick={() => handleTagClick(tag.id)}
                sx={{
                  cursor: "pointer",
                  maxWidth: "100%",
                }}
              />
            ))}
          </Box>
        }
        footer={
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={handleLikeClick}
              color={liked ? "primary" : "default"}
            >
              {liked ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
              <Typography sx={{ ml: 0.5 }}>{likeCount}</Typography>
            </IconButton>
          </Box>
        }
        actions={<EntityActionMenu actions={menuActions} />}
      />

      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <BookForm
          initialData={{ title, info: info ?? "", imageUrl, fileUrl, tags, authors }}
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditModalOpen(false)}
        />
      </EntityModal>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Ви впевнені, що хочете видалити цю книгу?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      <RagIndexDialog
        open={isRagIndexOpen}
        bookId={Number(id)}
        onClose={() => setIsRagIndexOpen(false)}
      />

      {isMarkdownEditorOpen && (
        <MarkdownEditorModal
          open={isMarkdownEditorOpen}
          bookId={Number(id)}
          onClose={() => setIsMarkdownEditorOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            queryClient.invalidateQueries({ queryKey: ["book", id] });
          }}
          parsed={parsed}
        />
      )}
    </>
  );
};

export default BookDetails;
