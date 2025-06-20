import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBookById, updateBook } from "../Api/BookApi";
import { useAuth } from "../Contexts/AuthContext";
import BookForm from "../Components/BookForm/BookForm";
import { SimpleAuthor, SimpleTag } from "../types";
import { useLocation } from "react-router-dom";
import { toast } from "react-fox-toast";
import LoadingIndicator from "../Components/LoadingIndicator";

const EditBookPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<{
    title: string;
    info: string;
    imageUrl?: string;
    fileUrl?: string;
    tags?: SimpleTag[];
    authors?: SimpleAuthor[]; // ОНОВЛЕНО
  } | null>(null);

  useEffect(() => {
    if (id) {
      getBookById(Number(id)).then((data) => {
        setInitialData({
          title: data.title,
          info: data.info || "",
          imageUrl: data.imageUrl,
          fileUrl: data.fileUrl,
          tags: data.tags || [],
          authors: data.authors || [],
        });
      });
    }
  }, [id]);

  if (!user || !user.roles || (!user.roles.includes("Librarian") && !user.roles.includes("Admin"))) {
    navigate("/login");
    return null;
  }

  const handleUpdateBook = async (formData: FormData) => {
    try {
      await updateBook(Number(id), formData);
      toast.success("Книга оновлена успішно!");
      navigate(location.state?.from || "/");
    } catch (error) {
      console.error("Failed to update book:", error);
      toast.error("Не вдалося оновити книгу.");
    }
  };

  return initialData ? <BookForm initialData={initialData} onSubmit={handleUpdateBook} /> : <LoadingIndicator />;
};

export default EditBookPage;