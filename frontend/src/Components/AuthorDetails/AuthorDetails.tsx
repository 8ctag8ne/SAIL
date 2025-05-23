import React from "react";
import { Card, CardContent, CardMedia, Typography, Box, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import BASE_URL from "../../config";
import { Author } from "../../types";
import PersonIcon from "@mui/icons-material/Person";


type AuthorDetailsProps = {
  author: Author;
  onDelete: () => void;
};

const AuthorDetails: React.FC<AuthorDetailsProps> = ({ author, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEditOrDelete = user?.roles.includes("Admin") || user?.roles.includes("Librarian");

  const handleEditClick = () => {
    navigate(`/authors/edit/${author.id}`);
  };

  return (
    <Card sx={{ display: "flex", flexDirection: "row", margin: "20px auto", padding: 2 }}>
    {author.imageUrl ? (
        <CardMedia
          component="img"
          sx={{ width: 200, height: 200, objectFit: "cover", marginRight: 2, borderRadius: 1,}}
          image={`${BASE_URL}${author.imageUrl}`}
          alt={author.name || "Author"}
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
          <PersonIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, position: "relative" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
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
            <IconButton color="error" onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthorDetails;