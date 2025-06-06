// TagsPageComponent.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Pagination, Select, MenuItem, FormControlLabel, Switch } from "@mui/material";
import TagCard from "../TagCard/TagCard";
import { getTags } from "../../Api/TagApi";
import { Tag } from "../../types";
import LoadingIndicator from "../LoadingIndicator";

const TagsPageComponent: React.FC = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    const [searchParams, setSearchParams] = useSearchParams();
    const pageNumber = parseInt(searchParams.get("page") || "1", 10);

    // Параметри за замовчуванням
    const defaultParams = {
        PageNumber: pageNumber,
        PageSize: 10,
        Title: searchParams.get("title") || "",
        SortBy: searchParams.get("sortBy") || "id",
        IsDescenging: searchParams.get("isDescending") === "true"
    };

    const fetchTags = async () => {
        setLoading(true);
        try {
            const data = await getTags(defaultParams);
            setTags(data.items);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching tags:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, [searchParams]);

    return (
        <Box sx={{}}>
            {/* Додайте фільтри, як у BooksPageComponent */}
            {/* <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Select
                    value={searchParams.get("sortBy") || "id"}
                    onChange={(e) => 
                        setSearchParams({ 
                            ...Object.fromEntries(searchParams), 
                            sortBy: e.target.value,
                            page: "1" // Скидання сторінки при зміні сортування
                        })}
                >
                    <MenuItem value="id">Newest</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                </Select>

                <FormControlLabel
                    control={
                        <Switch
                            checked={searchParams.get("isDescending") === "true"}
                            onChange={(e) => 
                                setSearchParams({ 
                                    ...Object.fromEntries(searchParams), 
                                    isDescending: e.target.checked.toString(),
                                    page: "1" 
                                })}
                        />
                    }
                    label="Descending"
                />
            </Box> */}

            {loading ? (
                <LoadingIndicator />
            ) : tags.length === 0 ? (
                <Typography>Нічого не знайдено.</Typography>
            ) : (
                <>
                    {tags.map((tag) => (
                        <TagCard key={tag.id} tag={tag} />
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

export default TagsPageComponent;