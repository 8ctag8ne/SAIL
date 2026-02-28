import React from "react";
import { Box } from "@mui/material";

type PageContainerProps = {
    children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
    return (
        <Box
            sx={{
                padding: 3, // Відступи для всіх сторінок
                maxWidth: "1200px", // Максимальна ширина сторінки
                margin: "0 auto", // Центрування сторінки
            }}
        >
            {children}
        </Box>
    );
};

export default PageContainer;