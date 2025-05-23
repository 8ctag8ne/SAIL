import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, deleteUser } from "../Api/Account";
import { getLikedBooksForUser } from "../Api/BookApi";
import { getBookListsForUser } from "../Api/BookListApi";
import { User, Book, BookList } from "../types";
import PageContainer from "../Components/PageContainer/PageContainer";
import BookCard from "../Components/BookCard/BookCard";
import { Box, Typography, Card, CardContent, IconButton, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "../Contexts/AuthContext";
import LockIcon from "@mui/icons-material/Lock";
import CreateBookListButton from "../Components/BookList/CreateBookListButton";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import BookListCard from "../Components/BookList/BookListCard";

const getRoleIcon = (roles: string[]) => {
  if (roles.includes("Admin")) return <AdminPanelSettingsIcon color="error" sx={{ fontSize: 40 }} />;
  if (roles.includes("Librarian")) return <LibraryBooksIcon color="primary" sx={{ fontSize: 40 }} />;
  return <PersonIcon color="action" sx={{ fontSize: 40 }} />;
};

const getHighestRole = (roles: string[]): string => {
  if (roles.includes("Admin")) return "Admin";
  if (roles.includes("Librarian")) return "Librarian";
  return "User";
};

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [likedBooks, setLikedBooks] = useState<Book[]>([]);
  const [bookLists, setBookLists] = useState<BookList[]>([]);
  const [tab, setTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;
  const isAdmin = user && user.roles.includes("Admin");

  useEffect(() => {
    if (id) {
      getUserById(id).then((data) => setProfile(data as User));
      getLikedBooksForUser(id).then(setLikedBooks);
      getBookListsForUser(id).then(setBookLists);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!profile) return;
    await deleteUser(profile.id);
    setDeleteDialogOpen(false);
    if (isOwnProfile) {
      localStorage.removeItem("token");
      window.location.href = "/";
    } else {
      navigate("/users");
    }
  };

  if (!profile) {
    return (
      <PageContainer>
        <Typography>Loading...</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card sx={{ maxWidth: 600, margin: "32px auto", position: "relative" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
           {getRoleIcon(profile.roles)}
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {profile.userName}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {profile.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Role: <b>{getHighestRole(profile.roles)}</b>
              </Typography>
              {profile.about && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {profile.about}
                </Typography>
              )}
              {profile.phoneNumber && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Phone: {profile.phoneNumber}
                </Typography>
              )}
            </Box>
            {(isOwnProfile || isAdmin) && (
              <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                <IconButton color="primary" onClick={() => navigate(`/users/edit/${profile.id}`)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>
        <Tab label="Liked Books" />
        <Tab label="Book Lists" />
      </Tabs>
      {tab === 0 && (
        <Box>
          {likedBooks.length === 0 ? (
            <Typography color="text.secondary" align="center">
              No liked books yet.
            </Typography>
          ) : (
            likedBooks.map((book) => <BookCard key={book.id} {...book} tags={book.tags}/>)
          )}
        </Box>
      )}
      {tab === 1 && (
        <Box>
            {/* Додаємо кнопку створення списку */}
            {isOwnProfile && (
            <Box sx={{ mb: 2 }}>
                <CreateBookListButton onCreated={() => getBookListsForUser(id!).then(setBookLists)} />
            </Box>
            )}
            {bookLists.length === 0 ? (
            <Typography color="text.secondary" align="center">
                No book lists yet.
            </Typography>
            ) : (
            bookLists.map((list) => (
                <BookListCard
                    key={list.id}
                    list={list}
                    onDeleted={id => setBookLists(prev => prev.filter(l => l.id !== id))}
                    onUpdated={updated => setBookLists(prev => prev.map(l => l.id === updated.id ? updated : l))}
                />
                ))
            )}
        </Box>
        )}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default UserProfilePage;