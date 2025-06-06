import React from "react";
import { Card, CardContent, CardMedia, Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import { deleteAuthor } from "../../Api/AuthorApi";
import BASE_URL from "../../config";
import { Author } from "../../types";
import PersonIcon from "@mui/icons-material/Person";
import { toast } from "react-fox-toast";

type AuthorCardProps = {
  author: Author;
};

const AuthorCard: React.FC<AuthorCardProps> = ({ author }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/authors/edit/${author.id}`);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this author?")) {
      try {
        await deleteAuthor(author.id);
        toast.success("Author deleted successfully!");
        navigate("/authors");
      } catch (error) {
        console.error("Failed to delete author:", error);
        toast.error("Failed to delete author.");
      }
    }
  };

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  return (
    <Card
      onClick={() => navigate(`/authors/${author.id}`)}
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
      {author.imageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: 150, height: 150, objectFit: "cover", marginRight: 2, borderRadius: 1,}}
          image={`${BASE_URL}${author.imageUrl}`}
          alt={author.name || "Author"}
        />
      ) : (
        <Box
          sx={{
            width: 150,
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 2,
            background: "#eee",
            borderRadius: 1,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, position: "relative" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {author.name}
        </Typography>
        {author.info && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {author.info}
          </Typography>
        )}
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

export default AuthorCard;