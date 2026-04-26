import { Routes, Route, BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect } from "react";
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
import { useSearchParams } from "react-router-dom";
import BookListPage from "./pages/BookListPage";
import UsersPage from "./pages/UsersPage";
import RagSearchPage from "./pages/RagSearchPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Footer from "./components/layout/Footer/Footer";
import HelpPage from "./pages/HelpPage";
import { TourProvider, useTour } from "./contexts/TourContext";
import { Joyride, EVENTS, STATUS, ACTIONS } from "react-joyride";
import { Box } from "@mui/material";
import { ToastContainer } from "react-fox-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const GlobalJoyride = () => {
    const { run, setRun, steps, stepIndex, setStepIndex, stopTour, activeTour } = useTour();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (run && (activeTour === "user_save_books" || activeTour === "lib_rag_index") && stepIndex === 0) {
            if (location.pathname !== "/") {
                navigate("/");
            }
        }
    }, [run, activeTour, stepIndex, location.pathname, navigate]);

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            locale={{ back: 'Назад', close: 'Закрити', last: 'Завершити', next: 'Далі', skip: 'Пропустити' }}
            onEvent={(data: any) => {
                const { action, index, status, type } = data;

                if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
                    if (activeTour === "user_rag") {
                        navigate("/help");
                    }
                    stopTour();
                    return;
                }

                if (type === EVENTS.STEP_AFTER) {
                    const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

                    if (activeTour === "guest_navigation") {
                        if (index === 3 && action === ACTIONS.NEXT) {
                            // Navigate to Author page
                            const authorLink = document.querySelector('.tour-author-link') as HTMLElement;
                            if (authorLink) {
                                authorLink.click();
                            } else {
                                navigate("/authors/1");
                            }
                            setTimeout(() => setStepIndex(nextStepIndex), 400);
                        } else if (index === 4 && action === ACTIONS.PREV) {
                            // Go back from Author page to Home page
                            navigate("/");
                            setTimeout(() => setStepIndex(nextStepIndex), 400);
                        } else if (index === 4 && action === ACTIONS.NEXT) {
                            // Navigate from Author page to Book page
                            const bookCard = document.querySelector('.tour-book-card') as HTMLElement;
                            if (bookCard) {
                                bookCard.click();
                            } else {
                                navigate("/books/1");
                            }
                            setTimeout(() => setStepIndex(nextStepIndex), 400);
                        } else if (index === 5 && action === ACTIONS.PREV) {
                            // Go back from Book page to Author page
                            navigate(-1);
                            setTimeout(() => setStepIndex(nextStepIndex), 400);
                        } else {
                            setStepIndex(nextStepIndex);
                        }
                    } else if (activeTour === "user_rag") {
                        if (index === 0 && action === ACTIONS.NEXT) {
                            setRun(false);
                            setStepIndex(1); // Set to next step, will resume in RagSearchPage
                            navigate("/rag-search?q=Що робити при критичній кровотечі?");
                        } else {
                            setStepIndex(nextStepIndex);
                        }
                    } else {
                        setStepIndex(nextStepIndex);
                    }
                }
            }}
            options={{
                arrowColor: '#15171a',
                backgroundColor: '#15171a',
                overlayColor: 'rgba(0, 0, 0, 0.5)',
                primaryColor: '#7ed321',
                textColor: '#e0e0e0',
                showProgress: true,
                disableFocusTrap: true,
                buttons: ['back', 'close', 'primary', 'skip'],
                zIndex: 10000,
            }}
            styles={{
                tooltip: { backgroundColor: '#15171a', borderRadius: 0, border: '1px solid #2d2f33', color: '#e0e0e0' },
                buttonPrimary: { backgroundColor: '#7ed321', color: '#0d0f12', borderRadius: 0 },
                buttonBack: { color: '#e0e0e0' },
                buttonSkip: { color: '#ff5252' }
            }}
        />
    );
};
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <TourProvider>
                        <ToastContainer position="top-center" />
                        <BrowserRouter>
                            <GlobalJoyride />
                            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                                <Navbar />
                                <Box
                                    component="main"
                                    sx={{
                                        pt: '80px', // Відступ висоти навбару
                                        flexGrow: 1,
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
                                        <Route path="/rag-search" element={<RagSearchPage />} />
                                        <Route path="/privacy" element={<PrivacyPolicy />} />
                                        <Route path="/terms" element={<TermsOfUse />} />
                                        <Route path="/help" element={<HelpPage />} />
                                    </Routes>
                                </Box>
                                <Footer />
                            </Box>
                        </BrowserRouter>
                    </TourProvider>
                </AuthProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;
