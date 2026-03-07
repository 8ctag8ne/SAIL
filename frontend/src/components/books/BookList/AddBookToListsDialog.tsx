import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";
import { getBookListsForUser, addBookToLists } from "../../../api/BookListApi";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import { BookList } from "../../../types";
import { getBookListIdsForBook } from "../../../api/BookApi";
import CreateBookListButton from "./CreateBookListButton";
import { useAuth } from "../../../contexts/AuthContext";
import EntityListSelector from "../../ui/EntityListSelector";

type Props = {
  open: boolean;
  onClose: () => void;
  bookId: number;
  onBookAdded?: () => void;
};

const AddBookToListsDialog: React.FC<Props> = ({ open, onClose, bookId, onBookAdded }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState<BookList[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [alreadyInLists, setAlreadyInLists] = useState<number[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id && open) {
      getBookListsForUser(user.id).then(setLists);
      getBookListIdsForBook(bookId).then(setAlreadyInLists);
      setSelected([]);
      setSearchQuery("");
    }
  }, [user, bookId, open, refresh]);

  const handleToggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    setIsSubmitting(true);
    try {
      await addBookToLists(bookId, selected);
      onBookAdded?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLists = lists.filter(list =>
    (list.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={() => !isSubmitting && onClose()} fullWidth>
      <DialogTitle>Додати книгу до списків</DialogTitle>
      <DialogContent>
        <CreateBookListButton onCreated={() => setRefresh(r => r + 1)} />
        <Box sx={{ mt: 2 }}>
          <EntityListSelector
            items={filteredLists}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Пошук списку..."
            keyExtractor={list => list.id}
            isItemSelected={list => selected.includes(list.id) || alreadyInLists.includes(list.id)}
            isItemDisabled={list => alreadyInLists.includes(list.id)}
            onToggleItem={list => handleToggle(list.id)}
            renderItem={list => (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body1" component="span">
                  {list.title}
                  {list.isPrivate && (
                    <Typography component="span" color="text.secondary" sx={{ ml: 1, fontSize: 14 }}>
                      (Приватний)
                    </Typography>
                  )}
                </Typography>
                {alreadyInLists.includes(list.id) && (
                  <Typography color="primary" sx={{ ml: 1, fontSize: 14 }}>
                    Уже додано до цього списку
                  </Typography>
                )}
              </Box>
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
        <Button
          onClick={handleAdd}
          disabled={selected.length === 0 || isSubmitting}
          variant="outlined"
        >
          {isSubmitting ? <LoadingIndicator minHeight={24} /> : "Додати до списку"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBookToListsDialog;