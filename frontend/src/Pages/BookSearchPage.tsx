import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from "../components/search/SearchBar/SearchBar";
import BooksPageComponent from "../components/books/BooksPageComponent/BooksPageComponent";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import AdvancedSearch from "../components/search/AdvancedSearch/AdvancedSearch";
import { Box } from "@mui/material";


const SEARCH_WIDTH = 700;

const BookSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("query") || "";
  const [advanced, setAdvanced] = useState<{ AuthorIds?: number[]; TagIds?: number[] }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyCombinedSearch = (query: string, filters: { AuthorIds?: number[]; TagIds?: number[] }) => {
    setSearchParams({
      query,
      ...(filters.AuthorIds && filters.AuthorIds.length > 0 ? { authors: filters.AuthorIds.join(",") } : {}),
      ...(filters.TagIds && filters.TagIds.length > 0 ? { tags: filters.TagIds.join(",") } : {}),
      page: "1",
    });
  };

  const handleSearch = (query: string) => {
    applyCombinedSearch(query, advanced);
  };

  const handleAdvancedSearch = (params: { AuthorIds?: number[]; TagIds?: number[] }) => {
    setAdvanced(params);
    applyCombinedSearch(searchQuery, params);
  };

  const queryParams: any = {
    Title: searchQuery,
    ...(advanced.AuthorIds && advanced.AuthorIds.length > 0 ? { AuthorIds: advanced.AuthorIds } : {}),
    ...(advanced.TagIds && advanced.TagIds.length > 0 ? { TagIds: advanced.TagIds } : {}),
  };

  return (
    <PageContainer>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: SEARCH_WIDTH,
        }}>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Пошук книг..."
            value={searchQuery}
            onFilterToggle={() => setShowAdvanced((v) => !v)}
            isFilterActive={showAdvanced}
          />
          {showAdvanced && (
            <AdvancedSearch
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