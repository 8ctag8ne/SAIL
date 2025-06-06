import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from "../Components/SearchBar/SearchBar";
import BooksPageComponent from "../Components/BooksPageComponent/BooksPageComponent";
import PageContainer from "../Components/PageContainer/PageContainer";
import AdvancedSearch from "../Components/AdvancedSearch/AdvancedSearch";
import { Box, IconButton } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";


const SEARCH_WIDTH = 700;

const BookSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("query") || "";
  const [advanced, setAdvanced] = useState<{ AuthorId?: number; TagIds?: number[] }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = (query: string) => {
    setSearchParams({ query, page: "1" });
    setAdvanced({});
    setShowAdvanced(false);
  };

  const handleAdvancedSearch = (params: { AuthorId?: number; TagIds?: number[] }) => {
    setAdvanced(params);
    setSearchParams({
      query: searchQuery,
      ...(params.AuthorId ? { author: params.AuthorId.toString() } : {}),
      ...(params.TagIds && params.TagIds.length > 0 ? { tags: params.TagIds.join(",") } : {}),
      page: "1",
    });
  };

  const queryParams: any = {
    Title: searchQuery,
    ...(advanced.AuthorId ? { AuthorId: advanced.AuthorId } : {}),
    ...(advanced.TagIds && advanced.TagIds.length > 0 ? { TagIds: advanced.TagIds } : {}),
  };

  return (
    <PageContainer>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", width: SEARCH_WIDTH }}>
          <Box sx={{ flex: 1 }}>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Пошук книг..."
              value={searchQuery}
            />
          </Box>
          <IconButton
            aria-label="Розширений пошук"
            onClick={() => setShowAdvanced((v) => !v)}
            color={showAdvanced ? "primary" : "default"}
            size="large"
            sx={{ ml: 1 }}
          >
            <FilterAltIcon />
          </IconButton>
          <IconButton
            aria-label="CheatSheet"
            onClick={() => navigate("/cheatsheet")}
            color="secondary"
            size="large"
            // sx={{ ml: 1 }}
          >
            <AutoAwesomeIcon />
          </IconButton>
        </Box>
        {showAdvanced && (
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            width={SEARCH_WIDTH}
          />
        )}
      </Box>
      <BooksPageComponent queryParams={queryParams} />
    </PageContainer>
  );
};

export default BookSearchPage;