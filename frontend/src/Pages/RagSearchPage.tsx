import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, Switch, Slider, FormGroup, FormControlLabel, Stack, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import SearchBar from "../components/search/SearchBar/SearchBar";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import RagSearchView from "../components/ui/RagSearchView/RagSearchView";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TuneIcon from "@mui/icons-material/Tune";
import { RagResponse } from "../types";
import { askRagQuestion } from "../api/AiApi";

const ragCache = new Map<string, RagResponse>();

const RagSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [ragResult, setRagResult] = useState<RagResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(0.7);
  const ragResultRef = React.useRef<HTMLDivElement>(null);

  const fetchRagData = async (searchString: string, tempParam: number) => {
    const cacheKey = `${searchString}_${tempParam}`;
    if (ragCache.has(cacheKey)) {
        setRagResult(ragCache.get(cacheKey) as RagResponse);
        setError(null);
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await askRagQuestion(searchString, tempParam);
      ragCache.set(cacheKey, result);
      setRagResult(result);
    } catch (err: any) {
      setError(err.response?.data || err.message || "Сталася помилка при пошуку");
      setRagResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(urlQuery); // Sync the SearchBar text with the URL
    if (urlQuery.trim()) {
      fetchRagData(urlQuery, temperature);
    } else {
      setRagResult(null); // Clear results if URL is empty
    }
  }, [urlQuery]);

  const handleSearchSubmit = (newQuery: string) => {
    if (!newQuery.trim()) {
      searchParams.delete("q");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ q: newQuery });
    }
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
        onSearch={handleSearchSubmit}
        onChange={(e) => setQuery(e.target.value)}
        value={query}
        icon={<AutoAwesomeIcon />}
      />

      <Accordion elevation={0} sx={{ bgcolor: "transparent", "&:before": { display: "none" }, mb: 2 }}>
        <AccordionSummary expandIcon={<TuneIcon />} sx={{ px: 1 }}>
          <Typography>Опції пошуку</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>

            <Box>
              <Typography gutterBottom>Креативність (Температура)</Typography>
              <Slider
                value={temperature}
                onChange={(_, newValue) => setTemperature(newValue as number)}
                step={0.1}
                marks
                min={0}
                max={1}
                valueLabelDisplay="auto"
              />
            </Box>
            {/* <FormControl fullWidth size="small">
              <InputLabel>Мова відповіді</InputLabel>
              <Select label="Мова відповіді" defaultValue="Автоматично">
                <MenuItem value="Українська">Українська</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Автоматично">Автоматично</MenuItem>
              </Select>
            </FormControl> */}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {loading && (
        <Box sx={{ mt: 4 }}>
          <LoadingIndicator />
        </Box>
      )}

      {error && (
        <Box sx={{ mt: 4 }}>
          <Typography color="error" textAlign="center">{error}</Typography>
        </Box>
      )}

      {!loading && !error && ragResult && (
        <RagSearchView ref={ragResultRef} ragResponse={ragResult} onSearch={handleSearchSubmit} />
      )}
    </Box>
  );
};

export default RagSearchPage;
