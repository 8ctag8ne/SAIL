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

  const navActionSx = {
    borderRadius: 0,
    color: "inherit",
    border: "1px solid transparent",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      borderColor: "primary.main",
      backgroundColor: "primary.main",
      color: "#0d0f12",
      "& .MuiSvgIcon-root": {
        color: "#0d0f12",
      },
    },
  };

  const menuItemSx = {
    "&:hover": {
      backgroundColor: "primary.main",
      color: "#0d0f12",
    },
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: "none",
        borderBottom: "1px solid #2d2f33",
        backgroundColor: "background.default",
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit", "&:hover": { color: "primary.main" } }}
        >
          Smart AI - integrated Library
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
          <Button color="inherit" component={Link} to="/books" sx={navActionSx}>
            Книги
          </Button>
          <Button color="inherit" component={Link} to="/authors" sx={navActionSx}>
            Автори
          </Button>
          <Button color="inherit" component={Link} to="/tags" sx={navActionSx}>
            Теги
          </Button>
          <Button color="inherit" component={Link} to="/cheatsheet" startIcon={<AutoAwesomeIcon />} sx={navActionSx}>
            Чит - лист
          </Button>
          {isAdmin && (
            <Button color="inherit" component={Link} to="/users" startIcon={<PeopleIcon />} sx={navActionSx}>
              Користувачі
            </Button>
          )}
        </Box>
        {isAdminOrLibrarian && (
          <>
            <IconButton
              color="inherit"
              onClick={handleAddMenuOpen}
              sx={{ ml: 1, ...navActionSx }}
              aria-label="add"
            >
              <AddIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleAddMenuClose}
              sx={{
                "& .MuiPaper-root": {
                  borderRadius: 0,
                  border: "1px solid #2d2f33",
                }
              }}
            >
              <MenuItem
                sx={menuItemSx}
                onClick={() => {
                  handleAddMenuClose();
                  setIsAddBookOpen(true);
                }}
              >
                Книга
              </MenuItem>
              <MenuItem
                sx={menuItemSx}
                onClick={() => {
                  handleAddMenuClose();
                  setIsAddTagOpen(true);
                }}
              >
                Тег
              </MenuItem>
              <MenuItem
                sx={menuItemSx}
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
              <TagForm key={isAddTagOpen ? "open" : "closed"} onSubmit={handleAddTagSubmit} />
            </EntityModal>
          </>
        )}
        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
            <IconButton
              color="inherit"
              onClick={() => navigate(`/users/${user.id}`)}
              sx={{ mr: 1, ...navActionSx }}
              aria-label="profile"
            >
              <AccountCircleIcon />
            </IconButton>
            <Button color="inherit" onClick={handleLogout} sx={navActionSx}>
              Вийти
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
            <Button color="inherit" onClick={() => navigate("/login")} sx={navActionSx}>
              Логін
            </Button>
            <Button color="inherit" onClick={() => navigate("/register")} sx={navActionSx}>
              Реєстрація
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;