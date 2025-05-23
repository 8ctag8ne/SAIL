import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Pagination } from "@mui/material";
import BookCard from "../BookCard/BookCard";
import { getBooks } from "../../Api/BookApi";
import { Book } from "../../types";

type BooksPageComponentProps = {
  queryParams?: Record<string, any>; // Додаткові параметри для запиту
};

const BooksPageComponent: React.FC<BooksPageComponentProps> = ({ queryParams = {} }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageNumber = parseInt(searchParams.get("page") || "1", 10);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks({ ...queryParams, PageNumber: pageNumber, PageSize: 10 });
      setBooks(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [queryParams, pageNumber]);

  return (
    <Box sx={{ padding: 2 }}>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : books.length === 0 ? (
        <Typography>No books found.</Typography>
      ) : (
        <>
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
            <Pagination
              count={totalPages}
              page={pageNumber}
              onChange={(e, value) => {
                setSearchParams(prev => {
                  const params = new URLSearchParams(prev);
                  params.set("page", value.toString());
                  return params;
                });
              }}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default BooksPageComponent;