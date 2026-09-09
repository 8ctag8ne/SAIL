import React from "react";
import { Box } from "@mui/material";

type PageContainerProps = {
    children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
    return (
        <Box
            sx={{
                padding: { xs: 0.5, sm: 1.5, md: 2 }, // Адаптивні відступи
                maxWidth: "1200px", // Максимальна ширина сторінки
                margin: "0 auto", // Центрування сторінки
                width: "100%",
            }}
        >
            {children}
        </Box>
    );
};

export default PageContainer;