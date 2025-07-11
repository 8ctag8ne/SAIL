import React, { useState, useEffect } from "react";
import { TextField, Box, MenuItem, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete } from "@mui/material";
import { SimpleAuthor } from "../../types";
import { getAuthors, addAuthor } from "../../Api/AuthorApi";

type SingleAuthorSelectProps = {
  selectedAuthor: SimpleAuthor | null;
  onChange: (author: SimpleAuthor | null) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
};

const SingleAuthorSelect: React.FC<SingleAuthorSelectProps> = ({
  selectedAuthor,
  onChange,
  searchValue,
  onSearchChange,
}) => {
  const [authors, setAuthors] = useState<SimpleAuthor[]>([]);
  const [internalSearch, setInternalSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Для діалогу додавання автора
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [adding, setAdding] = useState(false);

  // Використовуємо або зовнішній, або внутрішній стан пошуку
  const search = searchValue !== undefined ? searchValue : internalSearch;
  const setSearchValue = onSearchChange || setInternalSearch;

  useEffect(() => {
  setLoading(true);
  // Додаємо параметри для отримання всіх авторів (без пагінації)
  getAuthors({ PageSize: 1000, Title: search })
    .then((data) => {
      setAuthors(data.items.map((a) => ({ id: a.id, name: a.name || "" })));
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, [search]);

  // Додаємо selectedAuthor у список, якщо його там немає
  useEffect(() => {
    if (
      selectedAuthor &&
      !authors.some((a) => a.id === selectedAuthor.id)
    ) {
      setAuthors((prev) => [...prev, selectedAuthor]);
    }
  }, [selectedAuthor, authors]);

  const filteredAuthors = authors.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Додавання нового автора через API
  const handleAddAuthor = async () => {
    setAdding(true);
    try {
      const created = await addAuthor({ name: newAuthorName });
      setAuthors((prev) => [...prev, { id: created.id, name: created.name as string }]);
      onChange({ id: created.id, name: created.name as string });
      setAddDialogOpen(false);
      setNewAuthorName("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Box sx={{ mt: 0, width: "100%" }}>
      <Autocomplete
        options={authors}
        getOptionLabel={(option) => option.name}
        value={selectedAuthor}
        onChange={(_, value) => onChange(value)}
        inputValue={search}
        onInputChange={(_, value) => setSearchValue(value)}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Автор"
            size="small"
            fullWidth
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={
          search.trim() !== ""
            ? (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                fullWidth
                sx={{ mt: 1 }}
                onMouseDown={e => {
                  e.preventDefault();
                  setAddDialogOpen(true);
                  setNewAuthorName(search);
                }}
              >
                Додати нового автора "{search}"
              </Button>
            )
            : "Автори не знайдені"
        }
      />

      {selectedAuthor && (!selectedAuthor.id || selectedAuthor.id === 0) && search.trim() && (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => {
            setAddDialogOpen(true);
            setNewAuthorName(search);
          }}
        >
          Додати нового автора "{search}"
        </Button>
      )}

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Додати нового автора</DialogTitle>
        <DialogContent>
          <TextField
            label="Ім'я"
            value={newAuthorName}
            onChange={e => setNewAuthorName(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Скасувати</Button>
          <Button
            onClick={handleAddAuthor}
            disabled={!newAuthorName.trim() || adding}
            variant="contained"
          >
            Додати
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SingleAuthorSelect;