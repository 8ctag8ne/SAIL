import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, deleteUser, editUser, setUserRole } from "../api/Account";
import { useLikedBooks } from "../hooks/useLikedBooks";
import { getBookListsForUser } from "../api/BookListApi";
import { User, Book, BookList } from "../types";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import BookCard from "../components/books/BookCard/BookCard";
import { Box, Typography, Card, CardContent, IconButton, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "../contexts/AuthContext";
import LockIcon from "@mui/icons-material/Lock";
import CreateBookListButton from "../components/books/BookList/CreateBookListButton";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import BookListCard from "../components/books/BookList/BookListCard";
import EntityModal from "../components/ui/EntityModal/EntityModal";
import UserForm from "../components/user/UserForm/UserForm";
import { toast } from "react-fox-toast";

const getRoleIcon = (roles: string[]) => {
  if (roles.includes("Admin")) return <AdminPanelSettingsIcon color="error" sx={{ fontSize: 40 }} />;
  if (roles.includes("Librarian")) return <LibraryBooksIcon color="primary" sx={{ fontSize: 40 }} />;
  return <PersonIcon color="action" sx={{ fontSize: 40 }} />;
};

const getHighestRole = (roles: string[]): string => {
  if (roles.includes("Admin")) return "Адміністратор";
  if (roles.includes("Librarian")) return "Бібліотекар";
  return "Користувач";
};

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const { data: likedBooks = [] } = useLikedBooks(id);
  const [bookLists, setBookLists] = useState<BookList[]>([]);
  const [tab, setTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;
  const isAdmin = user && user.roles.includes("Admin");

  useEffect(() => {
    if (id) {
      getUserById(id).then((data) => setProfile(data as User));
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

  const handleEditSubmit = async (data: { userName: string; email: string; about: string; phoneNumber: string; role: string }) => {
    if (!profile) return;
    try {
      await editUser(profile.id, {
        userName: data.userName,
        email: data.email,
        about: data.about,
        phoneNumber: data.phoneNumber
      });
      if (isAdmin && data.role !== (profile.roles[0] || "User")) {
        await setUserRole(profile.id, data.role);
      }
      toast.success("Дані користувача оновлено успішно!");

      // Reload profile data locally 
      const updatedUser = await getUserById(profile.id);
      setProfile(updatedUser as User);
      setIsEditModalOpen(false);

      if (isOwnProfile) {
        // You might need to refresh global user context here depending on your AuthContext implementation
        // For now window reload as fallback or relying on another fetch if Context requires
      }
    } catch (error) {
      toast.error("Не вдалося оновити дані.");
    }
  };

  if (!profile) {
    return (
      <PageContainer>
        <Typography>Завантаження...</Typography>
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
                Роль: <b>{getHighestRole(profile.roles)}</b>
              </Typography>
              {profile.about && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {profile.about}
                </Typography>
              )}
              {profile.phoneNumber && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Телефон: {profile.phoneNumber}
                </Typography>
              )}
            </Box>
            {(isOwnProfile || isAdmin) && (
              <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                <IconButton color="primary" onClick={() => setIsEditModalOpen(true)}>
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
        <Tab label="Вподобання" />
        <Tab label="Списки книг" />
      </Tabs>
      {tab === 0 && (
        <Box>
          {likedBooks.length === 0 ? (
            <Typography color="text.secondary" align="center">
              Жодних уподобаних книг.
            </Typography>
          ) : (
            likedBooks.map((book) => <BookCard key={book.id} {...book} tags={book.tags} />)
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
              Жодних списків книг.
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
        <DialogTitle>Видалити користувача</DialogTitle>
        <DialogContent>
          <Typography>Ви впевнені, що хочете видалити цього користувача?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Скасувати</Button>
          <Button color="error" onClick={handleDelete}>
            Видалити
          </Button>
        </DialogActions>
      </Dialog>

      <EntityModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <UserForm
          initialData={{
            userName: profile.userName || "",
            email: profile.email || "",
            about: profile.about || "",
            phoneNumber: profile.phoneNumber || "",
            role: profile.roles.includes("Admin") ? "Admin" : profile.roles.includes("Librarian") ? "Librarian" : "User"
          }}
          onSubmit={handleEditSubmit}
        />
      </EntityModal>
    </PageContainer>
  );
};

export default UserProfilePage;