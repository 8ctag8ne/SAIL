import React from "react";
import { Box, Typography, Button, Container, Divider } from "@mui/material";
import { useTour } from "../contexts/TourContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const HelpPage = () => {
  const { startTour } = useTour();
  const { user } = useAuth();

  const navigate = useNavigate();

  const handleStartTour = (tourName: string) => {
    if (tourName === "guest_navigation" || tourName === "lib_rag_index") {
      navigate("/");
      setTimeout(() => startTour(tourName), 200);
    } else if (tourName === "user_rag") {
      navigate("/rag-search");
      setTimeout(() => startTour(tourName), 200);
    } else {
      startTour(tourName);
    }
  };

  const isUser = !!user;
  const isLibrarian = user?.roles?.includes("Librarian") || user?.roles?.includes("Admin");
  const isAdmin = user?.roles?.includes("Admin");

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold" }}>
        [ Центр допомоги ]
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontFamily: "'JetBrains Mono', monospace" }}>
          [ Загальні ]
        </Typography>
        <Divider sx={{ mb: 2, borderColor: "#2d2f33" }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
          <Button variant="outlined" onClick={() => handleStartTour("guest_navigation")} sx={{ borderRadius: 0, borderColor: "#2d2f33", color: "text.primary" }}>
            Гайд: Навігація по сайту
          </Button>
          <Button variant="outlined" onClick={() => handleStartTour("user_rag")} sx={{ borderRadius: 0, borderColor: "#2d2f33", color: "text.primary" }}>
            Гайд: Інтелектуальний RAG-пошук
          </Button>
        </Box>
      </Box>

      {isUser && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontFamily: "'JetBrains Mono', monospace" }}>
            [ Для користувачів ]
          </Typography>
          <Divider sx={{ mb: 2, borderColor: "#2d2f33" }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            <Button variant="outlined" onClick={() => handleStartTour("user_save_books")} sx={{ borderRadius: 0, borderColor: "#2d2f33", color: "text.primary" }}>
              Гайд: Збереження книг у список
            </Button>
          </Box>
        </Box>
      )}

      {isLibrarian && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontFamily: "'JetBrains Mono', monospace" }}>
            [ Для бібліотекарів ]
          </Typography>
          <Divider sx={{ mb: 2, borderColor: "#2d2f33" }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            <Button variant="outlined" onClick={() => handleStartTour("lib_create_book")} sx={{ borderRadius: 0, borderColor: "#2d2f33", color: "text.primary" }}>
              Гайд: Створення книги з автогенерацією метаданих
            </Button>
            <Button variant="outlined" onClick={() => handleStartTour("lib_rag_index")} sx={{ borderRadius: 0, borderColor: "#2d2f33", color: "text.primary" }}>
              Гайд: Опціональна індексація
            </Button>
          </Box>
        </Box>
      )}

      {isAdmin && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" gutterBottom sx={{ color: "primary.main", fontFamily: "'JetBrains Mono', monospace" }}>
            [ Для адміністраторів ]
          </Typography>
          <Divider sx={{ mb: 2, borderColor: "#2d2f33" }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            <Button variant="outlined" onClick={() => handleStartTour("admin_users")} sx={{ borderRadius: 0, borderColor: "#2d2f33", color: "text.primary" }}>
              Гайд: Керування користувачами та ролями
            </Button>
          </Box>
        </Box>
      )}

    </Container>
  );
};

export default HelpPage;
