import React, { useState } from "react";
import { Card, CardContent, Typography, Box, IconButton, TextField, Switch, FormControlLabel } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { BookList } from "../../types";
import { useAuth } from "../../Contexts/AuthContext";
import { updateBookList, deleteBookList } from "../../Api/BookListApi";
import { useNavigate } from "react-router-dom";

type BookListCardProps = {
  list: BookList;
  onDeleted?: (id: number) => void;
  onUpdated?: (list: BookList) => void;
};

const BookListCard: React.FC<BookListCardProps> = ({ list, onDeleted, onUpdated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === list.userId || user?.roles.includes("Admin");

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title || "");
  const [description, setDescription] = useState(list.description || "");
  const [isPrivate, setIsPrivate] = useState(list.isPrivate ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updated = await updateBookList(list.id, {
      title,
      description,
      isPrivate,
      bookIds: list.books.map(b => b.id),
    });
    setSaving(false);
    setEditing(false);
    onUpdated?.(updated);
  };

  const handleDelete = async () => {
    await deleteBookList(list.id);
    onDeleted?.(list.id);
  };

  return (
    <Card sx={{ my: 2, position: "relative", cursor: "pointer" }} onClick={() => navigate(`/booklists/${list.id}`)}>
      <CardContent sx={{ position: "relative", pb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {editing ? (
            <TextField
              value={title}
              onChange={e => setTitle(e.target.value)}
              size="small"
              variant="standard"
              sx={{ fontWeight: "bold", fontSize: 22, flex: 1 }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <Typography variant="h6" fontWeight="bold">
              {list.title}
            </Typography>
          )}
          {(!editing && isPrivate) && <LockIcon fontSize="small" color="action" />}
          {/* Іконки справа */}
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
                      handleDelete();
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
                      setTitle(list.title || "");
                      setDescription(list.description || "");
                      setIsPrivate(list.isPrivate ?? false);
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
              onClick={e => e.stopPropagation()}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  color="primary"
                  onClick={e => e.stopPropagation()}
                />
              }
              label="Private"
              sx={{ mt: 1 }}
              onClick={e => e.stopPropagation()}
            />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {list.description}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Books: {list.books.map(b => b.title).join(", ")}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default BookListCard;