import React from "react";
import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import { User } from "../../types";
import { useAuth } from "../../Contexts/AuthContext";

const getRoleIcon = (roles: string[]) => {
  if (roles.includes("Admin")) return <AdminPanelSettingsIcon color="error" sx={{ fontSize: 32 }} />;
  if (roles.includes("Librarian")) return <LibraryBooksIcon color="primary" sx={{ fontSize: 32 }} />;
  return <PersonIcon color="action" sx={{ fontSize: 32 }} />;
};

const getHighestRole = (roles: string[]): string => {
  if (roles.includes("Admin")) return "Admin";
  if (roles.includes("Librarian")) return "Librarian";
  return "User";
};

type Props = {
  user: User;
  showEdit?: boolean;
};

const UserCard: React.FC<Props> = ({ user, showEdit }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes("Admin");

  return (
    <Card sx={{ my: 2, cursor: "pointer", maxWidth: 400, mx: "auto", position: "relative" }} onClick={() => navigate(`/users/${user.id}`)}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {getRoleIcon(user.roles)}
        <Box>
          <Typography variant="h6">{user.userName}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          <Typography variant="body2" color="text.secondary">
            Role: <b>{getHighestRole(user.roles)}</b>
          </Typography>
        </Box>
        {showEdit && isAdmin && (
          <IconButton
            color="primary"
            sx={{ ml: "auto" }}
            onClick={e => {
              e.stopPropagation();
              navigate(`/users/edit/${user.id}`);
            }}
          >
            <EditIcon />
          </IconButton>
        )}
      </CardContent>
    </Card>
  );
};

export default UserCard;