import React, { useState } from "react";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { addBookList } from "../../../api/BookListApi";
import { BookListCreate } from "../../../types";
import EntityModal from "../../ui/EntityModal/EntityModal";
import BookListForm from "./BookListForm";

type Props = {
  onCreated?: () => void;
};

const CreateBookListButton: React.FC<Props> = ({ onCreated }) => {
  const [open, setOpen] = useState(false);

  const handleCreate = async (data: BookListCreate) => {
    await addBookList(data);
    setOpen(false);
    onCreated?.();
  };

  return (
    <>
      <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpen(true)} sx={{ borderRadius: 0, fontFamily: "JetBrains Mono" }}>
        Новий список
      </Button>
      <EntityModal open={open} onClose={() => setOpen(false)}>
        <BookListForm
          onSubmit={handleCreate}
          onClose={() => setOpen(false)}
        />
      </EntityModal>
    </>
  );
};

export default CreateBookListButton;