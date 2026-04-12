import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookListById, removeBookFromList } from "../api/BookListApi";
import { BookList } from "../types";
import BookCard from "../components/books/BookCard/BookCard";
import { Box, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import BookListCard from "../components/books/BookList/BookListCard";
import { toast } from "react-fox-toast";

const BookListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [bookList, setBookList] = useState<BookList | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwner = user && bookList && (user.id === bookList.userId);

  const [removeBookConfirmId, setRemoveBookConfirmId] = useState<number | null>(null);

  const fetchList = async () => {
    if (id) {
      const data = await getBookListById(Number(id));
      setBookList(data);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line
  }, [id]);

  const handleRemoveBookClick = (bookId: number) => {
    setRemoveBookConfirmId(bookId);
  };

  const handleConfirmRemoveBook = async () => {
    if (!bookList || removeBookConfirmId === null) return;
    try {
      await removeBookFromList(removeBookConfirmId, bookList.id);
      toast.success("Книгу успішно вилучено!", { isCloseBtn: true });
      fetchList();
    } catch (error) {
      toast.error("Не вдалося вилучити книгу.", { isCloseBtn: true });
    } finally {
      setRemoveBookConfirmId(null);
    }
  };

  if (!bookList) return <LoadingIndicator />;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <BookListCard
        list={bookList}
        onDeleted={() => navigate("/users/" + user?.id)}
        onUpdated={() => fetchList()}
      />

      <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
        Книги в списку:
      </Typography>
      <Box>
        {bookList.books.length === 0 ? (
          <Typography color="text.secondary">Цей список порожній.</Typography>
        ) : (
          bookList.books.map(book => (
            <Box key={book.id} sx={{ position: "relative", mb: 2 }}>
              <BookCard tags={[]} {...book} onRemoveFromList={isOwner ? () => handleRemoveBookClick(book.id) : undefined} />
            </Box>
          ))
        )}
      </Box>

      <ConfirmDialog
        open={removeBookConfirmId !== null}
        title="Ви впевнені, що хочете видалити цю книгу зі списку?"
        onConfirm={handleConfirmRemoveBook}
        onCancel={() => setRemoveBookConfirmId(null)}
      />
    </Box>
  );
};

export default BookListPage;