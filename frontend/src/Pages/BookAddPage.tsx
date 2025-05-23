import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addBook } from "../Api/BookApi";
import { useAuth } from "../Contexts/AuthContext";
import BookForm from "../Components/BookForm/BookForm";
import ForbiddenPage from "./ForbiddenPage";
import { useLocation } from "react-router-dom";

const AddBookPage: React.FC = () => {
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

  const handleAddBook = async (formData: FormData) => {
    try {
      await addBook(formData);
      alert("Book added successfully!");
      navigate(location.state?.from || "/");
    } catch (error) {
      console.error("Failed to add book:", error);
      alert("Failed to add book.");
    }
  };

  if (isForbidden) {
    return <ForbiddenPage />;
  }

  return user && user.roles && (user.roles.includes("Librarian") || user.roles.includes("Admin")) ? (
    <BookForm onSubmit={handleAddBook} />
  ) : null;
};

export default AddBookPage;