import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookListById, removeBookFromList, updateBookList, deleteBookList } from "../Api/BookListApi";
import { BookList } from "../types";
import BookCard from "../Components/BookCard/BookCard";
import { Box, Typography, Card, CardContent, IconButton, TextField, Switch, FormControlLabel } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../Contexts/AuthContext";

const BookListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [bookList, setBookList] = useState<BookList | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwner = user && bookList && (user.id === bookList.userId || user.roles.includes("Admin"));

  // Для inline-редагування
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    if (id) {
      const data = await getBookListById(Number(id));
      setBookList(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setIsPrivate(data.isPrivate ?? false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line
  }, [id]);

  const handleRemoveBook = async (bookId: number) => {
    if (!bookList) return;
    await removeBookFromList(bookId, bookList.id);
    fetchList();
  };

  const handleSave = async () => {
    if (!bookList) return;
    setSaving(true);
    const updated = await updateBookList(bookList.id, {
      title,
      description,
      isPrivate,
      bookIds: bookList.books.map(b => b.id),
    });
    setSaving(false);
    setEditing(false);
    setBookList(updated);
  };

  const handleDeleteList = async () => {
    if (!bookList) return;
    await deleteBookList(bookList.id);
    navigate("/users/" + user?.id); // або на головну, або на профіль користувача
  };

  if (!bookList) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ position: "relative", pb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {editing ? (
              <TextField
                value={title}
                onChange={e => setTitle(e.target.value)}
                size="small"
                variant="standard"
                sx={{ fontWeight: "bold", fontSize: 22, flex: 1 }}
              />
            ) : (
              <Typography variant="h5">{bookList.title}</Typography>
            )}
            {(!editing && isPrivate) && <LockIcon fontSize="small" color="action" />}
            {isOwner && (
              <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
                {!editing ? (
                  <>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={e => {
                        e.stopPropagation();
                        setEditing(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteList();
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={saving}
                      onClick={e => {
                        e.stopPropagation();
                        handleSave();
                      }}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        setEditing(false);
                        setTitle(bookList.title || "");
                        setDescription(bookList.description || "");
                        setIsPrivate(bookList.isPrivate ?? false);
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            )}
          </Box>
          {editing ? (
            <>
              <TextField
                value={description}
                onChange={e => setDescription(e.target.value)}
                size="small"
                variant="standard"
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                sx={{ mt: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    color="primary"
                  />
                }
                label="Private"
                sx={{ mt: 1 }}
              />
            </>
          ) : (
            bookList.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {bookList.description}
              </Typography>
            )
          )}
        </CardContent>
      </Card>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Books in this list:
      </Typography>
      <Box>
        {bookList.books.length === 0 ? (
          <Typography color="text.secondary">No books in this list.</Typography>
        ) : (
          bookList.books.map(book => (
            <Box key={book.id} sx={{ position: "relative", mb: 2 }}>
              <BookCard tags={[]} {...book} />
              {isOwner && (
                <IconButton
                  sx={{ position: "absolute", top: 8, right: 8 }}
                  color="error"
                  onClick={() => handleRemoveBook(book.id)}
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default BookListPage;