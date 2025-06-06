import React from "react";
import { Card, CardContent, CardMedia, Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { Tag } from "../../types";
import BASE_URL from "../../config";
import { useAuth } from "../../Contexts/AuthContext";
import { deleteTag } from "../../Api/TagApi";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { toast } from "react-fox-toast";

type TagCardProps = {
  tag: Tag;
};

const TagCard: React.FC<TagCardProps> = ({ tag }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tags/edit/${tag.id}`);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Ви впевнені, що хочете видалити цей тег?")) {
      try {
        await deleteTag(tag.id);
        toast.success("Тег видалений успішно!");
        navigate("/tags");
      } catch (error) {
        console.error("Failed to delete tag:", error);
        toast.error("не вдалося видалити тег.");
      }
    }
  };

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  return (
    <Card
      onClick={() => navigate(`/tags/${tag.id}`)}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 2,
        marginY: 1,
        cursor: "pointer",
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: 6 },
      }}
    >
      {tag.imageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: "cover", marginRight: 2 }}
          image={`${BASE_URL}${tag.imageUrl}`}
          alt={tag.title || "Tag"}
        />
      ) : (
        <Box
          sx={{
            width: 120,
            height: 120,
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
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {tag.title}
        </Typography>
        {tag.info && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {tag.info}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Книги: {tag.books.length}
        </Typography>
        {canEditOrDelete && (
          <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
            <IconButton color="primary" onClick={handleEditClick}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={handleDeleteClick}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TagCard;