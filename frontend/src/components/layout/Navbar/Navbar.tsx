import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
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
import MenuIcon from "@mui/icons-material/Menu";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import LogoutIcon from "@mui/icons-material/Logout";
import logo from "../../../logo.svg";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { mutateAsync: addBookMutation } = useAddBook();
  const { mutateAsync: addAuthorMutation } = useAddAuthor();
  const { mutateAsync: addTagMutation } = useAddTag();

  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isAddAuthorOpen, setIsAddAuthorOpen] = useState(false);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeDrawer = () => {
    setMobileOpen(false);
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
      toast.success("Книга створена успішно!", {
        isCloseBtn: true,
      });
      setIsAddBookOpen(false);
    } catch (error) {
      toast.error("Не вдалося створити книгу.", {
        isCloseBtn: true,
      });
    }
  };

  const handleAddAuthorSubmit = async (data: { name: string; info?: string; image?: File | null }) => {
    try {
      await addAuthorMutation({ name: data.name, info: data.info, image: data.image ?? undefined });
      toast.success("Автора успішно додано!", {
        isCloseBtn: true,
      });
      setIsAddAuthorOpen(false);
    } catch (error) {
      toast.error("Не вдалося додати автора.", {
        isCloseBtn: true,
      });
    }
  };

  const handleAddTagSubmit = async (data: { title: string; info?: string; image?: File | null; bookIds: number[] }) => {
    try {
      await addTagMutation({ title: data.title, info: data.info, image: data.image ?? undefined, bookIds: data.bookIds });
      toast.success("Тег успішно додано!", {
        isCloseBtn: true,
      });
      setIsAddTagOpen(false);
    } catch (error) {
      toast.error("Не вдалося додати тег.", {
        isCloseBtn: true,
      });
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

  const mobileMenuItemSx = {
    fontFamily: "'JetBrains Mono', monospace",
    border: "1px solid transparent",
    transition: "all 0.2s ease-in-out",
    color: "inherit",
    "&:hover": {
      borderColor: "primary.main",
      backgroundColor: "primary.main",
      color: "#0d0f12",
      "& .MuiListItemIcon-root, & .MuiListItemText-root, & .MuiTypography-root": {
        color: "#0d0f12",
      },
    },
  };

  const desktopContent = (
    <>
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
        <Button color="inherit" component={Link} to="/rag-search" startIcon={<AutoAwesomeIcon />} sx={navActionSx}>
          Знання
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
              },
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
    </>
  );

  const drawerContent = (
    <Box sx={{ width: 280, display: "flex", flexDirection: "column", height: "100%", pb: 2, backgroundColor: "background.default" }}>
      <Toolbar />
      <Box sx={{ pt: 2, px: 2, mb: 1 }}>
        <Typography variant="caption" sx={{ color: "text.primary", fontFamily: "'JetBrains Mono', monospace" }}>
          Military Archive & Retrieval System
        </Typography>
      </Box>
      <Box sx={{ my: 2, borderBottom: "1px dashed #2d2f33", mx: 1 }} />
      <Typography variant="body2" sx={{ mb: 1, px: 2, fontFamily: "'JetBrains Mono', monospace", color: "text.secondary" }}>
        ~ / навігація
      </Typography>
      <List sx={{ flexGrow: 1, px: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton component={Link} to="/books" onClick={closeDrawer} sx={mobileMenuItemSx}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText primary="Книги" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton component={Link} to="/authors" onClick={closeDrawer} sx={mobileMenuItemSx}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Автори" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton component={Link} to="/tags" onClick={closeDrawer} sx={mobileMenuItemSx}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <LocalOfferIcon />
            </ListItemIcon>
            <ListItemText primary="Теги" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton component={Link} to="/rag-search" onClick={closeDrawer} sx={mobileMenuItemSx}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <AutoAwesomeIcon />
            </ListItemIcon>
            <ListItemText primary="Знання" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
          </ListItemButton>
        </ListItem>
        {isAdmin && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton component={Link} to="/users" onClick={closeDrawer} sx={mobileMenuItemSx}>
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Користувачі" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </ListItemButton>
          </ListItem>
        )}

        {isAdminOrLibrarian && (
          <>
            <Box sx={{ my: 2, borderBottom: "1px dashed #2d2f33", mx: 1 }} />
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1, px: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              ./ керування
            </Typography>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => { closeDrawer(); setIsAddBookOpen(true); }} sx={mobileMenuItemSx}>
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText primary="Додати книгу" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => { closeDrawer(); setIsAddTagOpen(true); }} sx={mobileMenuItemSx}>
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText primary="Додати тег" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => { closeDrawer(); setIsAddAuthorOpen(true); }} sx={mobileMenuItemSx}>
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <AddIcon />
                </ListItemIcon>
                <ListItemText primary="Додати автора" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      <Box sx={{ mt: "auto", borderTop: "1px dashed #2d2f33", pt: 2, px: 1 }}>
        <List disablePadding>
          {user ? (
            <>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton onClick={() => { closeDrawer(); navigate(`/users/${user.id}`); }} sx={mobileMenuItemSx}>
                  <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Профіль" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout} sx={mobileMenuItemSx}>
                  <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Вийти" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton onClick={() => { closeDrawer(); navigate("/login"); }} sx={mobileMenuItemSx}>
                  <ListItemText primary="Логін" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => { closeDrawer(); navigate("/register"); }} sx={mobileMenuItemSx}>
                  <ListItemText primary="Реєстрація" primaryTypographyProps={{ fontFamily: "'JetBrains Mono', monospace" }} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
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
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, ...navActionSx }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              "&:hover": { color: "primary.main" },
              gap: 2,
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="MARS Logo"
              sx={{ height: 32, width: "auto" }}
            />
            <Typography
              variant="h6"
              sx={{
                display: { xs: "none", md: "none", lg: "block" },
              }}
            >
              Military Archive & Retrieval System
            </Typography>
            <Typography
              variant="h6"
              sx={{
                display: { xs: "block", md: "block", lg: "none" },
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "bold",
              }}
            >
              [ MARS ]
            </Typography>
          </Box>
          {!isMobile && desktopContent}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            backgroundColor: "background.default",
            borderRadius: 0,
            borderRight: "1px solid #2d2f33",
            backgroundImage: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {isAdminOrLibrarian && (
        <>
          <EntityModal open={isAddBookOpen} onClose={() => setIsAddBookOpen(false)}>
            <BookForm onSubmit={handleAddBookSubmit} onClose={() => setIsAddBookOpen(false)} />
          </EntityModal>

          <EntityModal open={isAddAuthorOpen} onClose={() => setIsAddAuthorOpen(false)}>
            <AuthorForm onSubmit={handleAddAuthorSubmit} onClose={() => setIsAddAuthorOpen(false)} />
          </EntityModal>

          <EntityModal open={isAddTagOpen} onClose={() => setIsAddTagOpen(false)}>
            <TagForm key={isAddTagOpen ? "open" : "closed"} onSubmit={handleAddTagSubmit} onClose={() => setIsAddTagOpen(false)} />
          </EntityModal>
        </>
      )}
    </>
  );
};

export default Navbar;