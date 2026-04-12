import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { getBookListsForUser } from "../../../api/BookListApi";
import BookListCard from "../../books/BookList/BookListCard";
import CreateBookListButton from "../../books/BookList/CreateBookListButton";
import { BookList } from "../../../types";

interface Props {
  userId: string;
  isOwnProfile: boolean;
}

const UserBookListsView: React.FC<Props> = ({ userId, isOwnProfile }) => {
  const [bookLists, setBookLists] = useState<BookList[]>([]);

  useEffect(() => {
    if (userId) {
      getBookListsForUser(userId).then(setBookLists);
    }
  }, [userId]);

  return (
    <Box sx={{ mt: 2 }}>
      {isOwnProfile && (
        <Box sx={{ mb: 2 }}>
          <CreateBookListButton onCreated={() => getBookListsForUser(userId).then(setBookLists)} />
        </Box>
      )}
      {bookLists.length === 0 ? (
        <Typography color="text.secondary" align="center">
          Жодних списків книг.
        </Typography>
      ) : (
        bookLists.map((list) => (
          <BookListCard
            key={list.id}
            list={list}
            onDeleted={id => setBookLists(prev => prev.filter(l => l.id !== id))}
            onUpdated={updated => setBookLists(prev => prev.map(l => l.id === updated.id ? updated : l))}
          />
        ))
      )}
    </Box>
  );
};

export default UserBookListsView;
