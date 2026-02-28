import { Routes, Route, BrowserRouter } from "react-router-dom";
import BookSearchPage from "./pages/BookSearchPage";
import BookDetailsPage from "./pages/BookDetailsPage";
import Navbar from "./components/layout/Navbar/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthorDetailsPage from "./pages/AuthorDetailsPage";
import AuthorListPage from "./pages/AuthorListPage";
import TagListPage from "./pages/TagListPage";
import TagDetailsPage from "./pages/TagDetailsPage";
import UserProfilePage from "./pages/UserProfilePage";
import BookListPage from "./pages/BookListPage";
import UsersPage from "./pages/UsersPage";
import CheatSheetPage from "./pages/CheatSheetPage";
import { Box } from "@mui/material";
import { ToastContainer } from "react-fox-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastContainer position="top-center" />
                <BrowserRouter>
                    <Navbar />
                    <Box
                        component="main"
                        sx={{
                            pt: '80px', // Відступ висоти навбару
                            minHeight: '100vh',
                            px: 3, // Бокові відступи
                            // py: 5  // Вертикальні відступи
                        }}
                    >
                        <Routes>
                            <Route path="/" element={<BookSearchPage />} />
                            <Route path="/books" element={<BookSearchPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/books/:id" element={<BookDetailsPage />} />
                            <Route path="/authors/:id" element={<AuthorDetailsPage />} />
                            <Route path="/authors" element={<AuthorListPage />} />
                            <Route path="/tags" element={<TagListPage />} />
                            <Route path="/tags/:id" element={<TagDetailsPage />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/users/:id" element={<UserProfilePage />} />
                            <Route path="/booklists/:id" element={<BookListPage />} />
                            <Route path="/cheatsheet" element={<CheatSheetPage />} />
                        </Routes>
                    </Box>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
