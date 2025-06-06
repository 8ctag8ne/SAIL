import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
      }}
    >
      <Typography variant="h3" color="error" gutterBottom>
        403 Forbidden
      </Typography>
      <Typography variant="body1" gutterBottom>
        Ви не маєте прав для доступу до цієї сторінки.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate("/")}>
        Повернутися на головну
      </Button>
    </Box>
  );
};

export default ForbiddenPage;