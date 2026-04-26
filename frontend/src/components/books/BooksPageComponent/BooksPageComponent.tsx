import React from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Pagination } from "@mui/material";
import BookCard from "../BookCard/BookCard";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import { useBooks } from "../../../hooks/useBooks";

type BooksPageComponentProps = {
  queryParams?: Record<string, any>;
};

const BooksPageComponent: React.FC<BooksPageComponentProps> = ({ queryParams = {} }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageNumber = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, isError } = useBooks({ ...queryParams, PageNumber: pageNumber, PageSize: 10 });

  return (
    <Box sx={{ padding: 2 }}>
      {isLoading ? (
        <LoadingIndicator />
      ) : isError || !data || data.items.length === 0 ? (
        <Typography>Нічого не знайдено.</Typography>
      ) : (
        <>
          {data.items.map((book, index) => (
            <BookCard key={book.id} className={index === 0 ? "tour-book-card" : undefined} {...book} />
          ))}
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
            <Pagination
              count={data.totalPages}
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