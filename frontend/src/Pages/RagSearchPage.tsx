import React, { useState } from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, Switch, Slider, FormGroup, FormControlLabel, Stack, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import SearchBar from "../components/search/SearchBar/SearchBar";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import RagSearchView from "../components/ui/RagSearchView/RagSearchView";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TuneIcon from "@mui/icons-material/Tune";
import { RagResponse } from "../types";
import mockRagData from "../mock/ragSearch.json";

const mockRagSearch = async (query: string): Promise<RagResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockRagData as RagResponse);
    }, 1500);
  });
};

const RagSearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [ragResult, setRagResult] = useState<RagResponse | null>(null);
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
      const result = await mockRagSearch(q);
      setRagResult(result);
    } catch {
      setRagResult(null);
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

      <Accordion elevation={0} sx={{ bgcolor: "transparent", "&:before": { display: "none" }, mb: 2 }}>
        <AccordionSummary expandIcon={<TuneIcon />} sx={{ px: 1 }}>
          <Typography>Опції пошуку</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControlLabel
              control={<Switch color="primary" />}
              label="Глибокий пошук (Reranker) - підвищує точність, але працює довше"
            />
            <Box>
              <Typography gutterBottom>Креативність (Температура)</Typography>
              <Slider
                defaultValue={0.3}
                step={0.1}
                marks
                min={0}
                max={1}
                valueLabelDisplay="auto"
              />
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Мова відповіді</InputLabel>
              <Select label="Мова відповіді" defaultValue="Автоматично">
                <MenuItem value="Українська">Українська</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Автоматично">Автоматично</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {loading && (
        <Box sx={{ mt: 4 }}>
          <LoadingIndicator />
        </Box>
      )}

      {!loading && ragResult && (
        <RagSearchView ref={ragResultRef} ragResponse={ragResult} onSearch={handleSearch} />
      )}
    </Box>
  );
};

export default RagSearchPage;
