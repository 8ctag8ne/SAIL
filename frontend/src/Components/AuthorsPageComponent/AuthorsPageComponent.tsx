import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Pagination } from "@mui/material";
import AuthorCard from "../AuthorCard/AuthorCard";
import { getAuthors } from "../../Api/AuthorApi";
import { Author } from "../../types";
import LoadingIndicator from "../LoadingIndicator";

const AuthorsPageComponent: React.FC = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    const [searchParams, setSearchParams] = useSearchParams();
    const pageNumber = parseInt(searchParams.get("page") || "1", 10);

    const fetchAuthors = async () => {
        setLoading(true);
        try {
            const data = await getAuthors({ 
                PageNumber: pageNumber,
                PageSize: 10,
                Title: searchParams.get("title") || ""
            });
            setAuthors(data.items);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching authors:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthors();
    }, [searchParams]);

    return (
        <Box sx={{ padding: 2 }}>
            {loading ? (
                <LoadingIndicator />
            ) : authors.length === 0 ? (
                <Typography>Не знайдено жодного автора.</Typography>
            ) : (
                <>
                    {authors.map((author) => (
                        <AuthorCard key={author.id} author={author} />
                    ))}
                    <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
                        <Pagination
                            count={totalPages}
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