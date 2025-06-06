import React from "react";
import { Typography, Box } from "@mui/material";
import PageContainer from "../Components/PageContainer/PageContainer";
import AuthorsPageComponent from "../Components/AuthorsPageComponent/AuthorsPageComponent";
import SearchBar from "../Components/SearchBar/SearchBar";
import { useSearchParams } from "react-router-dom";

const AuthorListPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const handleSearch = (query: string) => {
        const newParams = new URLSearchParams();
        if (query) newParams.set("title", query);
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    return (
        <PageContainer>
            <Box 
                sx={{ 
                    mb: 3, 
                    width: "100%", 
                    display: "flex", 
                    justifyContent: "center" 
                }}
            >
                <Box sx={{ width: "100%", maxWidth: 700 }}>
                    <SearchBar
                        placeholder="Пошук авторів..."
                        onSearch={handleSearch}
                        value={searchParams.get("title") || ""}
                    />
                </Box>
            </Box>
            <AuthorsPageComponent />
        </PageContainer>
    );
};

export default AuthorListPage;