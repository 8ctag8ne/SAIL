import React, { useState, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { getBooks } from "../../../api/BookApi";
import { SimpleBook } from "../../../types";
import EntityListSelector from "../../ui/EntityListSelector";

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
      <EntityListSelector
        items={books}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        searchPlaceholder="Пошук книги для додавання"
        keyExtractor={(item) => item.id}
        renderItem={(item) => <Typography>{item.title}</Typography>}
        isItemSelected={(item) => selectedBooks.some((b) => b.id === item.id)}
        onToggleItem={handleToggle}
        footerAction={
          page < totalPages ? (
            <Button
              variant="outlined"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
              sx={{ width: "100%" }}
            >
              More books
            </Button>
          ) : undefined
        }
      />
    </Box>
  );
};

export default BookSearchMultiSelect;