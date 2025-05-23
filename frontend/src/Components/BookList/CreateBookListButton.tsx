import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Checkbox } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { addBookList, BookListCreate } from "../../Api/BookListApi";

type Props = {
  onCreated?: () => void;
};

const CreateBookListButton: React.FC<Props> = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = async () => {
    await addBookList({ title, isPrivate, bookIds: [] });
    setOpen(false);
    setTitle("");
    setIsPrivate(false);
    onCreated?.();
  };

  return (
    <>
      <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
        New Book List
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create Book List</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
              />
            }
            label="Private"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim()} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateBookListButton;