import React, { useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import SearchBar from "../Components/SearchBar/SearchBar";
import CheatSheetView from "../Components/CheatSheetView/CheatSheetView";
import { getCheatSheet } from "../Api/FileApi";
import { CheatSheet } from "../types";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import mockCheatSheet from "../mock/cheatSheet.json";
import { generatePDF } from "../Components/GeneratePdf";



const SEARCH_WIDTH = 600;

const CheatSheetPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [cheatSheet, setCheatSheet] = useState<CheatSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const cheatSheetRef = React.useRef<HTMLDivElement>(null);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setCheatSheet(null);
      return;
    }
    setLoading(true);
    try {
      const result = await getCheatSheet(q);
      setCheatSheet(result);
    } catch {
      setCheatSheet({ tips: [], books: [], tags: [] });
    }
    setLoading(false);
    // setCheatSheet(mockCheatSheet);

  };

  return (
    <Box sx={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", pt: 8 }}>
      <Box sx={{ width: SEARCH_WIDTH, mb: 3 }}>
        <SearchBar
          placeholder="Введіть фразу для пошуку по знаннях..."
          onSearch={handleSearch}
          value={query}
          icon={<AutoAwesomeIcon />}
        />
      {!loading && cheatSheet && (
          <button
            onClick={() => generatePDF(cheatSheet)}
            style={{
              padding: "8px 18px",
              fontSize: "1rem",
              borderRadius: 6,
              border: "none",
              background: "#43a047",
              color: "#fff",
              cursor: "pointer",
              width: "100%", // Повна ширина, як у SearchBar
              textAlign: "center",
            }}
          >
            Завантажити PDF
          </button>
        )}
      </Box>
      {loading && <CircularProgress sx={{ mt: 4 }} />}
      {!loading && cheatSheet && (
        <CheatSheetView ref={cheatSheetRef} cheatSheet={cheatSheet} />
      )}
    </Box>
  );
};

export default CheatSheetPage;