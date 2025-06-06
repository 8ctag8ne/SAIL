import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthorById, deleteAuthor } from "../Api/AuthorApi";
import { Author } from "../types";
import PageContainer from "../Components/PageContainer/PageContainer";
import BooksPageComponent from "../Components/BooksPageComponent/BooksPageComponent";
import AuthorDetails from "../Components/AuthorDetails/AuthorDetails";
import { Typography } from "@mui/material";
import { toast } from "react-fox-toast";
import LoadingIndicator from "../Components/LoadingIndicator";
import ConfirmDialog from "../Components/ConfirmDialog";

const AuthorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        await deleteAuthor(Number(id));
        toast.success("Автор видалений успішно!");
        navigate("/authors");
      }
    } catch (error) {
      console.error("Failed to delete author:", error);
      toast.error("Не вдалося видалити автора.");
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
      <BooksPageComponent queryParams={{ AuthorId: id }} />
    </PageContainer>
  );
};

export default AuthorDetailsPage;
