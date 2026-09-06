import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getBookListsForUser, addBookToLists } from "../../../api/BookListApi";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import { BookList } from "../../../types";
import { getBookListIdsForBook } from "../../../api/BookApi";
import CreateBookListButton from "./CreateBookListButton";
import { useAuth } from "../../../contexts/AuthContext";
import EntityListSelector from "../../ui/EntityListSelector";
import { toast } from "react-fox-toast";
import { useTour } from "../../../contexts/TourContext";


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
  const { activeTour, stepIndex, setStepIndex, setRun } = useTour();
  const wasOpenRef = React.useRef(false);

  useEffect(() => {
    if (open) wasOpenRef.current = true;
  }, [open]);

  useEffect(() => {
    if (activeTour === "user_save_books") {
      if (open && stepIndex === 1) {
        setStepIndex(2);
      } else if (!open && wasOpenRef.current && (stepIndex === 2 || stepIndex === 3 || stepIndex === 4)) {
        setRun(false);
        wasOpenRef.current = false;
      }
    }
  }, [open, activeTour, stepIndex, setStepIndex, setRun]);

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
      toast.success("Книгу успішно додано до списків!", { isCloseBtn: true });
      onBookAdded?.();
      onClose();
    } catch (error) {
      toast.error("Не вдалося додати книгу до списків.", { isCloseBtn: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLists = lists.filter(list =>
    (list.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={() => !isSubmitting && onClose()} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 3 }, py: 2 }}>
        Додати до списку
        {onClose && (
          <IconButton className="tour-list-modal-close" onClick={onClose} sx={{ color: 'text.secondary', mr: -1 }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Box className="tour-list-modal-create">
          <CreateBookListButton onCreated={() => setRefresh(r => r + 1)} />
        </Box>
        <Box sx={{ mt: 2 }} className="tour-list-modal-select">
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
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 1 }}>
        <Button
          onClick={handleAdd}
          disabled={selected.length === 0 || isSubmitting}
          variant="outlined"
          fullWidth={true}
          sx={{ mr: 0 }}
        >
          {isSubmitting ? <LoadingIndicator minHeight={24} /> : "Додати до списку"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBookToListsDialog;