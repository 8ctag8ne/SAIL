import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, Typography, Box, Paper } from "@mui/material";
import { getBookListsForUser, addBookToLists } from "../../Api/BookListApi";
import { BookList } from "../../types";
import { getBookListIdsForBook } from "../../Api/BookApi";
import CreateBookListButton from "./CreateBookListButton";
import { useAuth } from "../../Contexts/AuthContext";

type Props = {
  open: boolean;
  onClose: () => void;
  bookId: number;
  onBookAdded?: () => void;
};

const AddBookToListsDialog: React.FC<Props> = ({ open, onClose, bookId, onBookAdded }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState<BookList[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [alreadyInLists, setAlreadyInLists] = useState<number[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (user?.id && open) {
      getBookListsForUser(user.id).then(setLists);
      getBookListIdsForBook(bookId).then(setAlreadyInLists);
      setSelected([]);
    }
  }, [user, bookId, open, refresh]);

  const handleToggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    await addBookToLists(bookId, selected);
    onBookAdded?.();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Додати книгу до списків</DialogTitle>
      <DialogContent>
        <CreateBookListButton onCreated={() => setRefresh(r => r + 1)} />
        <Box sx={{ mt: 2 }}>
          {lists.map(list => {
            const disabled = alreadyInLists.includes(list.id);
            return (
              <Paper
                key={list.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1,
                  mb: 1,
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                  background: selected.includes(list.id) ? "#e3f2fd" : "#fff",
                  border: "1px solid #eee",
                }}
                onClick={() => !disabled && handleToggle(list.id)}
                elevation={0}
              >
                <Checkbox
                  checked={selected.includes(list.id) || disabled}
                  disabled={disabled}
                  sx={{ mr: 1 }}
                />
                <Typography variant="body1">
                  {list.title}
                  {list.isPrivate && (
                    <Typography component="span" color="text.secondary" sx={{ ml: 1, fontSize: 14 }}>
                      (Приватний)
                    </Typography>
                  )}
                </Typography>
                {disabled && (
                  <Typography color="primary" sx={{ ml: 2, fontSize: 14 }}>
                    Уже додано до цього списку
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button
          onClick={handleAdd}
          disabled={selected.length === 0}
          variant="contained"
        >
          Додати до списку
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBookToListsDialog;