import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTagById, updateTag } from "../Api/TagApi";
import { useAuth } from "../Contexts/AuthContext";
import TagForm from "../Components/TagForm/TagForm";
import { SimpleBook } from "../types";
import ForbiddenPage from "./ForbiddenPage";
import { useLocation } from "react-router-dom";

const TagEditPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialData, setInitialData] = useState<{
    title: string;
    info?: string;
    imageUrl?: string;
    books?: SimpleBook[];
  } | null>(null);

  useEffect(() => {
    if (id) {
      getTagById(Number(id)).then((data) => {
        setInitialData({
          title: data.title || "",
          info: data.info || "",
          imageUrl: data.imageUrl ?? undefined,
          books: data.books?.map((b: any) => ({ id: b.id, title: b.title })) || [],
        });
      });
    }
  }, [id]);

  if (!user || !user.roles || (!user.roles.includes("Librarian") && !user.roles.includes("Admin"))) {
    return <ForbiddenPage />;
  }

  const handleUpdateTag = async (data: { title: string; info?: string; image: File | null; bookIds: number[] }) => {
  try {
    await updateTag(Number(id), {
      title: data.title,
      info: data.info,
      image: data.image ?? undefined,
      bookIds: data.bookIds,
    });
    alert("Tag updated successfully!");
    navigate(location.state?.from || "/tags");
  } catch (error) {
    console.log(error);
    alert("Failed to update tag.");
  }
};

  return initialData ? <TagForm initialData={initialData} onSubmit={handleUpdateTag} /> : <p>Loading...</p>;
};

export default TagEditPage;