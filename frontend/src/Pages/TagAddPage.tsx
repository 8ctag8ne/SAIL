import React from "react";
import { useNavigate } from "react-router-dom";
import { addTag } from "../Api/TagApi";
import { useAuth } from "../Contexts/AuthContext";
import TagForm from "../Components/TagForm/TagForm";
import ForbiddenPage from "./ForbiddenPage";
import { useLocation } from "react-router-dom";

const TagAddPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || !user.roles || (!user.roles.includes("Librarian") && !user.roles.includes("Admin"))) {
    return <ForbiddenPage />;
  }

  // ОНОВЛЕНО: приймає об'єкт, а не FormData
  const handleAddTag = async (data: { title: string; info?: string; image: File | null; bookIds: number[] }) => {
    try {
      await addTag({
        title: data.title,
        info: data.info,
        image: data.image ?? undefined,
        bookIds: data.bookIds,
      });
      alert("Tag added successfully!");
      navigate(location.state?.from ||"/tags");
    } catch (error) {
      alert("Failed to add tag.");
    }
  };

  return <TagForm onSubmit={handleAddTag} />;
};

export default TagAddPage;