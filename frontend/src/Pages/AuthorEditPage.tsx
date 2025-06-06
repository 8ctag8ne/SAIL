import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthorById, updateAuthor } from "../Api/AuthorApi";
import { useAuth } from "../Contexts/AuthContext";
import AuthorForm from "../Components/AuthorForm/AuthorForm";
import ForbiddenPage from "./ForbiddenPage";
import { useLocation } from "react-router-dom";
import { toast } from "react-fox-toast";

const AuthorEditPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialData, setInitialData] = useState<{
    name: string;
    info?: string;
    image?: string | null;
  } | null>(null);

  useEffect(() => {
    if (id) {
      getAuthorById(Number(id)).then((data) => {
        setInitialData({
          name: data.name || "",
          info: data.info || "",
          image: data.imageUrl,
        });
      });
    }
  }, [id]);

  if (!user || !user.roles || (!user.roles.includes("Librarian") && !user.roles.includes("Admin"))) {
    navigate("/login");
    return null;
  }

  // ЗМІНА: приймаємо об'єкт, а не FormData
  const handleUpdateAuthor = async (data: { name: string; info?: string; image: File | null }) => {
    try {
      // Convert image: null to image: undefined to match AuthorUpdate type
      const fixedData = { ...data, image: data.image ?? undefined };
      await updateAuthor(Number(id), fixedData);
      toast.success("Автор оновлений успішно!");
      navigate(location.state?.from || "/authors");
    } catch (error) {
      console.error("Failed to update author:", error);
      toast.error("Не вдалося оновити автора.");
    }
  };

  if (!initialData) return <p>Завантаження...</p>;

  return <AuthorForm initialData={initialData} onSubmit={handleUpdateAuthor} />;
};

export default AuthorEditPage;