import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Checkbox, List, ListItem, ListItemText, ListItemIcon, Typography } from "@mui/material";
import { getBooks } from "../../Api/BookApi";
import { SimpleBook } from "../../types";

type BookSearchMultiSelectProps = {
  selectedBooks: SimpleBook[];
  onChange: (books: SimpleBook[]) => void;
};

const BookSearchMultiSelect: React.FC<BookSearchMultiSelectProps> = ({ selectedBooks, onChange }) => {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<SimpleBook[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBooks([]);
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchBooks(page, search, page === 1);
    // eslint-disable-next-line
  }, [page, search]);

  const fetchBooks = async (pageNum: number, query: string, replace = false) => {
    setLoading(true);
    try {
      const data = await getBooks({ Title: query, PageNumber: pageNum, PageSize: 10 });
      setTotalPages(data.totalPages);
      setBooks((prev) => (replace ? data.items : [...prev, ...data.items]));
    } catch (e) {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (book: SimpleBook) => {
    if (selectedBooks.some((b) => b.id === book.id)) {
      onChange(selectedBooks.filter((b) => b.id !== book.id));
    } else {
      onChange([...selectedBooks, book]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBooks([]);
    setPage(1);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук книги для додавання"
          size="small"
          fullWidth
        />
        <Button type="submit" variant="contained">
          Пошук
        </Button>
      </form>
      <List dense sx={{ maxHeight: 200, overflow: "auto", border: "1px solid #eee", borderRadius: 1 }}>
        {books.map((book) => (
          <ListItem
            key={book.id}
            disablePadding
            sx={{
              cursor: "pointer",
              background: selectedBooks.some((b) => b.id === book.id) ? "#f0f0f0" : "inherit",
              "&:hover": { background: "#f5f5f5" }
            }}
            onClick={() => handleToggle(book)}
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={selectedBooks.some((b) => b.id === book.id)}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText primary={book.title} />
          </ListItem>
        ))}
        {books.length === 0 && !loading && (
          <ListItem>
            <ListItemText primary={<Typography color="text.secondary">Нічого не знайдено</Typography>} />
          </ListItem>
        )}
      </List>
      {page < totalPages && (
        <Button
          variant="outlined"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          sx={{ mt: 1, width: "100%" }}
        >
          More books
        </Button>
      )}
    </Box>
  );
};

export default BookSearchMultiSelect;