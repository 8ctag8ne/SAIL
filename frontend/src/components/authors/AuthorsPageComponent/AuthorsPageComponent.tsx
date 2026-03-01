import React from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Pagination } from "@mui/material";
import AuthorCard from "../AuthorCard/AuthorCard";
import LoadingIndicator from "../../../components/ui/LoadingIndicator";
import { useAuthors } from "../../../hooks/useAuthors";

const AuthorsPageComponent: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const pageNumber = parseInt(searchParams.get("page") || "1", 10);

    const { data, isLoading, isError } = useAuthors({
        PageNumber: pageNumber,
        PageSize: 10,
        Title: searchParams.get("title") || ""
    });

    return (
        <Box sx={{ padding: 2 }}>
            {isLoading ? (
                <LoadingIndicator />
            ) : isError || !data || data.items.length === 0 ? (
                <Typography>Не знайдено жодного автора.</Typography>
            ) : (
                <>
                    {data.items.map((author) => (
                        <AuthorCard key={author.id} author={author} />
                    ))}
                    <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
                        <Pagination
                            count={data.totalPages}
                            page={pageNumber}
                            onChange={(e, value) => {
                                setSearchParams(prev => {
                                    const params = new URLSearchParams(prev);
                                    params.set("page", value.toString());
                                    return params;
                                });
                            }}
                            color="primary"
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};

export default AuthorsPageComponent;