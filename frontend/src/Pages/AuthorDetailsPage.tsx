import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthorById, deleteAuthor } from "../Api/AuthorApi";
import { Author } from "../types";
import PageContainer from "../Components/PageContainer/PageContainer";
import BooksPageComponent from "../Components/BooksPageComponent/BooksPageComponent";
import AuthorDetails from "../Components/AuthorDetails/AuthorDetails";
import { Typography } from "@mui/material";

const AuthorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (window.confirm("Are you sure you want to delete this author?")) {
      try {
        if (id) {
          await deleteAuthor(Number(id));
          alert("Author deleted successfully!");
          navigate("/authors");
        }
      } catch (error) {
        console.error("Failed to delete author:", error);
        alert("Failed to delete author.");
      }
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!author) {
    return <Typography>Author not found.</Typography>;
  }

  return (
    <PageContainer>
      <AuthorDetails author={author} onDelete={handleDelete} />
      <Typography variant="h5" gutterBottom>
        Books by {author.name}:
      </Typography>
      <BooksPageComponent queryParams={{ AuthorId: id }} />
    </PageContainer>
  );
};

export default AuthorDetailsPage;