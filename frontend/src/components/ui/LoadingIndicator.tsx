import { Box, CircularProgress } from "@mui/material";

interface LoadingIndicatorProps {
    minHeight?: string | number;
}

const LoadingIndicator = ({ minHeight = 200 }: LoadingIndicatorProps) => {
    const isSmall = typeof minHeight === "number" ? minHeight < 40 : false;

    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight, height: "100%" }}>
            <CircularProgress size={isSmall ? 24 : 40} />
        </Box>
    );
};

export default LoadingIndicator;