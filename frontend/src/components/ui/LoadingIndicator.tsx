import { Box, CircularProgress } from "@mui/material";

const LoadingIndicator = () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", height: "100%" }}>
        <CircularProgress />
    </Box>
);

export default LoadingIndicator;