import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
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
                  navigate("/books/add", { state: { from: location.pathname } });
                }}
              >
                Книга
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleAddMenuClose();
                  navigate("/tags/add", { state: { from: location.pathname } });
                }}
              >
                Тег
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleAddMenuClose();
                  navigate("/authors/add", { state: { from: location.pathname } });
                }}
              >
                Автор
              </MenuItem>
            </Menu>
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