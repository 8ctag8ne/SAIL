import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addAuthor } from "../Api/AuthorApi";
import { useAuth } from "../Contexts/AuthContext";
import AuthorForm from "../Components/AuthorForm/AuthorForm";
import ForbiddenPage from "./ForbiddenPage";
import { useLocation } from "react-router-dom";

const AuthorAddPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isForbidden, setIsForbidden] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (!user.roles || (!user.roles.includes("Librarian") && !user.roles.includes("Admin"))) {
      setIsForbidden(true);
    }
  }, [user, navigate]);

  // ЗМІНА: приймаємо об'єкт, а не FormData
  const handleAddAuthor = async (data: { name: string; info?: string; image: File | null }) => {
    try {
      await addAuthor({ ...data, image: data.image ?? undefined });
      alert("Author added successfully!");
      navigate(location.state?.from || "/authors");
    } catch (error) {
      console.error("Failed to add author:", error);
      alert("Failed to add author.");
    }
  };

  if (isForbidden) {
    return <ForbiddenPage />;
  }

  return user && user.roles && (user.roles.includes("Librarian") || user.roles.includes("Admin")) ? (
    <AuthorForm onSubmit={handleAddAuthor} />
  ) : null;
};

export default AuthorAddPage;