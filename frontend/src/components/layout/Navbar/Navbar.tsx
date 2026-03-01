import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import EntityModal from "../../ui/EntityModal/EntityModal";
import BookForm from "../../books/BookForm/BookForm";
import AuthorForm from "../../authors/AuthorForm/AuthorForm";
import TagForm from "../../tags/TagForm/TagForm";
import { toast } from "react-fox-toast";
import { useAddBook } from "../../../hooks/useBooks";
import { useAddAuthor } from "../../../hooks/useAuthors";
import { useAddTag } from "../../../hooks/useTags";
import AddIcon from "@mui/icons-material/Add";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PeopleIcon from "@mui/icons-material/People";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();

  const { mutateAsync: addBookMutation } = useAddBook();
  const { mutateAsync: addAuthorMutation } = useAddAuthor();
  const { mutateAsync: addTagMutation } = useAddTag();

  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isAddAuthorOpen, setIsAddAuthorOpen] = useState(false);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAnchorEl(null);
  };

  const isAdminOrLibrarian = user?.roles?.includes("Admin") || user?.roles?.includes("Librarian");
  const isAdmin = user?.roles?.includes("Admin");

  const handleAddBookSubmit = async (formData: FormData) => {
    try {
      await addBookMutation(formData);
      toast.success("Книга створена успішно!");
      setIsAddBookOpen(false);
    } catch (error) {
      toast.error("Не вдалося створити книгу.");
    }
  };

  const handleAddAuthorSubmit = async (data: { name: string; info?: string; image?: File | null }) => {
    try {
      await addAuthorMutation({ name: data.name, info: data.info, image: data.image ?? undefined });
      toast.success("Автора успішно додано!");
      setIsAddAuthorOpen(false);
    } catch (error) {
      toast.error("Не вдалося додати автора.");
    }
  };

  const handleAddTagSubmit = async (data: { title: string; info?: string; image?: File | null; bookIds: number[] }) => {
    try {
      await addTagMutation({ title: data.title, info: data.info, image: data.image ?? undefined, bookIds: data.bookIds });
      toast.success("Тег успішно додано!");
      setIsAddTagOpen(false);
    } catch (error) {
      toast.error("Не вдалося додати тег.");
    }
  };

  return (
    <AppBar
      position="fixed" // Змінюємо з static на fixed
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1, // Забезпечуємо правильний z-index
        boxShadow: 1 // Додаємо тінь для кращого візуального відокремлення
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
        >
          Smart AI - integrated Library
        </Typography>
        {/* Лівий блок: Authors, Tags */}
        <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
          <Button color="inherit" component={Link} to="/books">
            Книги
          </Button>
          <Button color="inherit" component={Link} to="/authors">
            Автори
          </Button>
          <Button color="inherit" component={Link} to="/tags">
            Теги
          </Button>
          <Button color="inherit" component={Link} to="/cheatsheet" startIcon={<AutoAwesomeIcon />}>
            Чит - лист
          </Button>
          {isAdmin && (
            <Button color="inherit" component={Link} to="/users" startIcon={<PeopleIcon />}>
              Користувачі
            </Button>
          )}
        </Box>
        {/* Add menu (лише для Admin/Librarian) */}
        {isAdminOrLibrarian && (
          <>
            <IconButton
              color="inherit"
              onClick={handleAddMenuOpen}
              sx={{ ml: 1 }}
              aria-label="add"
            >
              <AddIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleAddMenuClose}
            >
              <MenuItem
                onClick={() => {
                  handleAddMenuClose();
                  setIsAddBookOpen(true);
                }}
              >
                Книга
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleAddMenuClose();
                  setIsAddTagOpen(true);
                }}
              >
                Тег
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleAddMenuClose();
                  setIsAddAuthorOpen(true);
                }}
              >
                Автор
              </MenuItem>
            </Menu>

            <EntityModal open={isAddBookOpen} onClose={() => setIsAddBookOpen(false)}>
              <BookForm onSubmit={handleAddBookSubmit} />
            </EntityModal>

            <EntityModal open={isAddAuthorOpen} onClose={() => setIsAddAuthorOpen(false)}>
              <AuthorForm onSubmit={handleAddAuthorSubmit} />
            </EntityModal>

            <EntityModal open={isAddTagOpen} onClose={() => setIsAddTagOpen(false)}>
              <TagForm onSubmit={handleAddTagSubmit} />
            </EntityModal>
          </>
        )}
        {/* Правий блок: Profile/Login/Register/Logout */}
        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
            <IconButton
              color="inherit"
              onClick={() => navigate(`/users/${user.id}`)}
              sx={{ mr: 1 }}
              aria-label="profile"
            >
              <AccountCircleIcon />
            </IconButton>
            <Button color="inherit" onClick={handleLogout}>
              Вийти
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
            <Button color="inherit" onClick={() => navigate("/login")}>
              Логін
            </Button>
            <Button color="inherit" onClick={() => navigate("/register")}>
              Реєстрація
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;