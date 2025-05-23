import { Routes, Route, BrowserRouter } from "react-router-dom";
import BookSearchPage from "./Pages/BookSearchPage";
import BookDetailsPage from "./Pages/BookDetailsPage";
import BookAddPage from "./Pages/BookAddPage";
import BookEditPage from "./Pages/BookEditPage";
import Navbar from "./Components/Navbar/Navbar";
import { AuthProvider } from "./Contexts/AuthContext";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import AuthorDetailsPage from "./Pages/AuthorDetailsPage";
import AuthorListPage from "./Pages/AuthorListPage";
import AuthorAddPage from "./Pages/AuthorAddPage";
import AuthorEditPage from "./Pages/AuthorEditPage";
import TagListPage from "./Pages/TagListPage";
import TagAddPage from "./Pages/TagAddPage";
import TagEditPage from "./Pages/TagEditPage";
import TagDetailsPage from "./Pages/TagDetailsPage";
import UserProfilePage from "./Pages/UserProfilePage";
import BookListPage from "./Pages/BookListPage";
import EditUserPage from "./Pages/EditUserPage";
import UsersPage from "./Pages/UsersPage";
import CheatSheetPage from "./Pages/CheatSheetPage";
// import EditBookPage from "./Pages/EditBookPage";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <Routes>
                    <Route path="/" element={<BookSearchPage />} />
                    <Route path="/books" element={<BookSearchPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/books/add" element={<BookAddPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/books/:id" element={<BookDetailsPage />} />
                    <Route path="/books/edit/:id" element={<BookEditPage />} />
                    <Route path="/authors/:id" element={<AuthorDetailsPage />} />
                    <Route path="/authors" element={<AuthorListPage />} />
                    <Route path="/authors/add" element={<AuthorAddPage />} />
                    <Route path="/authors/edit/:id" element={<AuthorEditPage />} />
                    <Route path="/tags" element={<TagListPage />} />
                    <Route path="/tags/add" element={<TagAddPage />} />
                    <Route path="/tags/edit/:id" element={<TagEditPage />} />
                    <Route path="/tags/:id" element={<TagDetailsPage />} />
                    <Route path="/users/:id" element={<UserProfilePage />} />
                    <Route path="/booklists/:id" element={<BookListPage />} />
                    <Route path="/users/edit/:id" element={<EditUserPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/cheatsheet" element={<CheatSheetPage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
