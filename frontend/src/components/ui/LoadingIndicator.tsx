import { Box, CircularProgress } from "@mui/material";

const LoadingIndicator = () => (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
    </Box>
);

export default LoadingIndicator;