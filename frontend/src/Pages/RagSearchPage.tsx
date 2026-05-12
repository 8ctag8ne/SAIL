import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, Slider, Stack } from "@mui/material";
import SearchBar from "../components/search/SearchBar/SearchBar";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import RagSearchView from "../components/ui/RagSearchView/RagSearchView";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TuneIcon from "@mui/icons-material/Tune";
import { RagResponse } from "../types";
import { askRagQuestion } from "../api/AiApi";
import { toast } from "react-fox-toast";
import { MOCK_RAG_RESPONSE } from "../mocks/ragTourMock";
import BASE_URL from "../config";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTour } from "../contexts/TourContext";

const ragCache = new Map<string, RagResponse>();

const RagSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [ragResult, setRagResult] = useState<RagResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [enableThinking, setEnableThinking] = useState<boolean>(false);
  const [thinkingText, setThinkingText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const ragResultRef = React.useRef<HTMLDivElement>(null);
  const { activeTour, stepIndex, run, setRun, stopTour } = useTour();

  useEffect(() => {
    if (activeTour === "user_rag" && stepIndex === 1 && !run) {
      if (!loading && ragResult) {
        setTimeout(() => setRun(true), 400);
      } else if (!loading && error) {
        toast.error("Не вдалося завантажити результати для туру.", { isCloseBtn: true });
        stopTour();
      }
    }
  }, [loading, ragResult, error, activeTour, stepIndex, run, setRun, stopTour]);

  const fetchRagData = async (searchString: string, tempParam: number, useThinking: boolean) => {
    setLoading(true);
    setError(null);
    setRagResult(null);
    setThinkingText("");
    setAnswerText("");

    let fullText = "";
    let partialResult: RagResponse = {
      query: searchString,
      answer: "",
      sources: [],
      suggestedQuestions: []
    };

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/api/Ai/rag/ask`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: searchString,
          temperature: tempParam,
          enable_thinking: useThinking
        })
      });

      if (!response.ok) {
        throw new Error(`Сталася помилка при пошуку (код ${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream not available");

      setLoading(false); // Прибираємо загальний індикатор, оскільки почався стрімінг

      const decoder = new TextDecoder();
      let buffer = "";

      setRagResult({ ...partialResult });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);
          boundary = buffer.indexOf('\n');

          if (line) {
            try {
              const data = JSON.parse(line);
              if (data.type === "error") {
                setError(data.data);
                return;
              } else if (data.type === "sources") {
                partialResult.sources = data.data;
                setRagResult({ ...partialResult });
              } else if (data.type === "questions") {
                partialResult.suggestedQuestions = data.data;
                setRagResult({ ...partialResult });
              } else if (data.type === "chunk") {
                fullText += data.data;

                const startTag = "<think>";
                const endTag = "</think>";

                const startIdx = fullText.indexOf(startTag);
                const endIdx = fullText.indexOf(endTag);

                if (startIdx !== -1) {
                  if (endIdx !== -1) {
                    const thinkContent = fullText.slice(startIdx + startTag.length, endIdx).trim();
                    const afterThink = fullText.slice(endIdx + endTag.length).trimStart();
                    setThinkingText(thinkContent);
                    setAnswerText(afterThink);
                    partialResult.answer = afterThink;
                  } else {
                    const thinkContent = fullText.slice(startIdx + startTag.length).trimStart();
                    setThinkingText(thinkContent);
                    setAnswerText("");
                  }
                } else {
                  setAnswerText(fullText);
                  partialResult.answer = fullText;
                }

                setRagResult({ ...partialResult });
              }
            } catch (e) {
              // ignore invalid json chunks
            }
          }
        }
      }
    } catch (err: any) {
      if (fullText.length > 0 || partialResult.sources.length > 0) {
        toast.error("З'єднання перервано. Відповідь може бути неповною.");
        const errMsg = "\n\n[Помилка з'єднання: генерація перервана]";
        setAnswerText(prev => prev + errMsg);
        partialResult.answer = partialResult.answer + errMsg;
        setRagResult({ ...partialResult });
      } else {
        setError(err.message || "Сталася помилка при пошуку");
        setRagResult(null);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(urlQuery); // Sync the SearchBar text with the URL
    if (activeTour === "user_rag") {
      setRagResult(MOCK_RAG_RESPONSE);
      setLoading(false);
      setError(null);
    } else if (urlQuery.trim()) {
      fetchRagData(urlQuery, temperature, enableThinking);
    } else {
      setRagResult(null); // Clear results if URL is empty
      setThinkingText("");
      setAnswerText("");
    }
  }, [urlQuery, activeTour, temperature, enableThinking]);

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
      <Box className="tour-rag-controls">
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
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableThinking}
                      onChange={(e) => setEnableThinking(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Увімкнути роздуми (Thinking)"
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>

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
        <RagSearchView
          ref={ragResultRef}
          ragResponse={ragResult}
          thinkingText={thinkingText}
          answerText={answerText}
          onSearch={handleSearchSubmit}
        />
      )}
    </Box>
  );
};

export default RagSearchPage;
