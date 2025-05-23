import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTagById, deleteTag } from "../Api/TagApi";
import { Tag } from "../types";
import PageContainer from "../Components/PageContainer/PageContainer";
import BooksPageComponent from "../Components/BooksPageComponent/BooksPageComponent";
import { Card, CardContent, CardMedia, Typography, Box, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../Contexts/AuthContext";
import BASE_URL from "../config";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";


const TagDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTag = async () => {
      try {
        if (id) {
          const tagData = await getTagById(Number(id));
          setTag(tagData);
        }
      } catch (error) {
        console.error("Failed to fetch tag:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTag();
  }, [id]);

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  const handleEditClick = () => {
    navigate(`/tags/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this tag?")) {
      try {
        if (id) {
          await deleteTag(Number(id));
          alert("Tag deleted successfully!");
          navigate("/tags");
        }
      } catch (error) {
        console.error("Failed to delete tag:", error);
        alert("Failed to delete tag.");
      }
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!tag) {
    return <Typography>Tag not found.</Typography>;
  }

  return (
    <PageContainer>
      <Card sx={{ display: "flex", flexDirection: "row", margin: "20px auto", padding: 2 }}>
        {tag.imageUrl ? (
            <CardMedia
            component="img"
            sx={{ width: 200, height: 200, objectFit: "cover", marginRight: 2 }}
            image={`${BASE_URL}${tag.imageUrl}`}
            alt={tag.title || "Tag"}
            />
        ) : (
            <Box
            sx={{
                width: 200,
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 2,
                background: "#eee",
                borderRadius: 1,
            }}
            >
            <LocalOfferIcon sx={{ fontSize: 48, color: "#bdbdbd" }} />
            </Box>
        )}
        <CardContent sx={{ flex: 1, position: "relative" }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {tag.title}
          </Typography>
          {tag.info && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {tag.info}
            </Typography>
          )}
          {canEditOrDelete && (
            <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
                <IconButton color="primary" onClick={handleEditClick}>
                <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={handleDelete}>
                <DeleteIcon />
                </IconButton>
            </Box>
            )}
        </CardContent>
      </Card>
      <Typography variant="h5" gutterBottom>
        Books with tag "{tag.title}":
      </Typography>
      <BooksPageComponent queryParams={{ TagIds: [Number(id)] }} />
    </PageContainer>
  );
};

export default TagDetailsPage;