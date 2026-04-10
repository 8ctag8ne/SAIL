import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import SearchBar from "../components/search/SearchBar/SearchBar";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import RagSearchView from "../components/ui/RagSearchView/RagSearchView";
import { getCheatSheet } from "../api/FileApi";
import { CheatSheet } from "../types";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { generatePDF } from "../utils/GeneratePdf";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const RagSearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [ragResult, setRagResult] = useState<CheatSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const ragResultRef = React.useRef<HTMLDivElement>(null);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setRagResult(null);
      return;
    }
    setLoading(true);
    try {
      const result = await getCheatSheet(q);
      setRagResult(result);
    } catch {
      setRagResult({ tips: [], books: [], tags: [] });
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        mt: 4,
        px: { xs: 2, sm: 3 },
      }}
    >
      <SearchBar
        placeholder="Введіть фразу для пошуку по знаннях..."
        onSearch={handleSearch}
        value={query}
        icon={<AutoAwesomeIcon />}
      />

      {!loading && ragResult && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => generatePDF(ragResult)}
            fullWidth
          >
            Завантажити PDF
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ mt: 4 }}>
          <LoadingIndicator />
        </Box>
      )}

      {!loading && ragResult && (
        <RagSearchView ref={ragResultRef} cheatSheet={ragResult} />
      )}
    </Box>
  );
};

export default RagSearchPage;
