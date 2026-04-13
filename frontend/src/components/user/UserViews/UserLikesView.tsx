import React from 'react';
import { Box, Typography } from '@mui/material';
import { useLikedBooks } from "../../../hooks/useLikedBooks";
import BookCard from "../../books/BookCard/BookCard";

interface Props {
  userId: string;
}

const UserLikesView: React.FC<Props> = ({ userId }) => {
  const { data: likedBooks = [] } = useLikedBooks(userId);

  return (
    <Box sx={{ mt: 2 }}>
      {likedBooks.length === 0 ? (
        <Typography color="text.secondary" align="center">
          Жодних уподобаних книг.
        </Typography>
      ) : (
        likedBooks.map((book) => <BookCard key={book.id} {...book} tags={book.tags} />)
      )}
    </Box>
  );
};

export default UserLikesView;
