import React, { useEffect, useState } from "react";
import { Box, Chip, TextField, CircularProgress, Typography } from "@mui/material";
import { SimpleBook } from "../../types";
import { getBooks } from "../../Api/BookApi";

type BookMultiSelectProps = {
  selectedBooks: SimpleBook[];
  onChange: (books: SimpleBook[]) => void;
};

const BookMultiSelect: React.FC<BookMultiSelectProps> = ({ selectedBooks, onChange }) => {
  const [books, setBooks] = useState<SimpleBook[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getBooks({ query: search }).then((data) => {
      // Якщо getBooks повертає пагінований результат:
      setBooks(data.items.map((b: any) => ({ id: b.id, title: b.title })));
      // Якщо повертає масив:
    //   setBooks(data.map((b: any) => ({ id: b.id, title: b.title })));
      setLoading(false);
    });
  }, [search]);

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      selectedBooks.some((b) => b.id === book.id)
  );

  const handleToggle = (book: SimpleBook) => {
    if (selectedBooks.some((b) => b.id === book.id)) {
      onChange(selectedBooks.filter((b) => b.id !== book.id));
    } else {
      onChange([...selectedBooks, book]);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <TextField
        label="Search books"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        size="small"
      />
      {loading ? (
        <CircularProgress size={24} sx={{ mt: 2 }} />
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {filteredBooks.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No books found
            </Typography>
          )}
          {filteredBooks.map((book) => (
            <Chip
              key={book.id}
              label={book.title}
              color={selectedBooks.some((b) => b.id === book.id) ? "primary" : "default"}
              variant={selectedBooks.some((b) => b.id === book.id) ? "filled" : "outlined"}
              onClick={() => handleToggle(book)}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BookMultiSelect;