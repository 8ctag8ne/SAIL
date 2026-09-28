import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/search/SearchBar/SearchBar";
import BooksPageComponent from "../components/books/BooksPageComponent/BooksPageComponent";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import AdvancedSearch from "../components/search/AdvancedSearch/AdvancedSearch";
import { Box } from "@mui/material";

const SEARCH_WIDTH = 700;

const BookSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchQuery = useMemo(() => {
    return searchParams.get("query") || searchParams.get("title") || searchParams.get("q") || "";
  }, [searchParams]);

  const authorIds = useMemo(() => {
    const raw = searchParams.get("authors");
    if (!raw) return [];
    return raw
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id) && id > 0);
  }, [searchParams]);

  const tagIds = useMemo(() => {
    const raw = searchParams.get("tags");
    if (!raw) return [];
    return raw
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id) && id > 0);
  }, [searchParams]);

  const hasActiveFilters = authorIds.length > 0 || tagIds.length > 0;
  const [showAdvanced, setShowAdvanced] = useState<boolean>(hasActiveFilters);

  const handleSearch = (newQuery: string) => {
    const newParams = new URLSearchParams();
    if (newQuery.trim()) {
      newParams.set("query", newQuery.trim());
    }
    if (authorIds.length > 0) {
      newParams.set("authors", authorIds.join(","));
    }
    if (tagIds.length > 0) {
      newParams.set("tags", tagIds.join(","));
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleAdvancedSearch = (params: { AuthorIds?: number[]; TagIds?: number[] }) => {
    const newParams = new URLSearchParams();
    if (searchQuery.trim()) {
      newParams.set("query", searchQuery.trim());
    }
    if (params.AuthorIds && params.AuthorIds.length > 0) {
      newParams.set("authors", params.AuthorIds.join(","));
    }
    if (params.TagIds && params.TagIds.length > 0) {
      newParams.set("tags", params.TagIds.join(","));
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (searchQuery.trim()) {
      params.Title = searchQuery.trim();
    }
    if (authorIds.length > 0) {
      params.AuthorIds = authorIds;
    }
    if (tagIds.length > 0) {
      params.TagIds = tagIds;
    }
    return params;
  }, [searchQuery, authorIds, tagIds]);

  return (
    <PageContainer>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: SEARCH_WIDTH,
          }}
        >
          <SearchBar
            onSearch={handleSearch}
            placeholder="Пошук книг..."
            value={searchQuery}
            onFilterToggle={() => setShowAdvanced((v) => !v)}
            isFilterActive={hasActiveFilters || showAdvanced}
          />
          {showAdvanced && (
            <AdvancedSearch
              initialAuthorIds={authorIds}
              initialTagIds={tagIds}
              onSearch={handleAdvancedSearch}
            />
          )}
        </Box>
      </Box>
      <BooksPageComponent queryParams={queryParams} />
    </PageContainer>
  );
};

export default BookSearchPage;