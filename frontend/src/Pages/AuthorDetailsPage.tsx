import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthorById } from "../api/AuthorApi";
import { Author } from "../types";
import { useDeleteAuthor } from "../hooks/useAuthors";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import BooksPageComponent from "../components/books/BooksPageComponent/BooksPageComponent";
import AuthorDetails from "../components/authors/AuthorDetails/AuthorDetails";
import { Typography } from "@mui/material";
import { toast } from "react-fox-toast";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const AuthorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutateAsync: deleteAuthorMutation } = useDeleteAuthor();

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        if (id) {
          const authorData = await getAuthorById(Number(id));
          setAuthor(authorData);
        }
      } catch (error) {
        console.error("Failed to fetch author:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthor();
  }, [id]);

  const handleDelete = async () => {
    try {
      if (id) {
        await deleteAuthorMutation(Number(id));
        toast.success("Автор видалений успішно!", {
          isCloseBtn: true,
        });
        navigate("/authors");
      }
    } catch (error) {
      console.error("Failed to delete author:", error);
      toast.error("Не вдалося видалити автора.", {
        isCloseBtn: true,
      });
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!author) {
    return <Typography>Автор не знайдений.</Typography>;
  }

  return (
    <PageContainer>
      <AuthorDetails author={author} onDelete={() => setConfirmOpen(true)} />

      <ConfirmDialog
        open={confirmOpen}
        title="Ви впевнені, що хочете видалити цього автора?"
        onConfirm={() => {
          setConfirmOpen(false);
          handleDelete();
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      <Typography variant="h5" gutterBottom>
        Книги від автора {author.name}:
      </Typography>
      <BooksPageComponent queryParams={{ AuthorIds: [id] }} />
    </PageContainer>
  );
};

export default AuthorDetailsPage;
