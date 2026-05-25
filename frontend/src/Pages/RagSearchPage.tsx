import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, Slider, Stack, Button } from "@mui/material";
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

const memoryCache = new Map<string, { ragResult: RagResponse; thinkingText: string }>();

const getCachedResult = (key: string): { ragResult: RagResponse; thinkingText: string } | null => {
  try {
    const cached = sessionStorage.getItem(`rag_cache_${key}`);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    // Ignore error
  }
  return memoryCache.get(key) || null;
};

const setCachedResult = (key: string, data: { ragResult: RagResponse; thinkingText: string }) => {
  try {
    sessionStorage.setItem(`rag_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // Ignore error
  }
  memoryCache.set(key, data);
};

const RagSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlTemp = parseFloat(searchParams.get("temp") || "0.1");
  const urlThinking = searchParams.get("thinking") === "true";
  const urlHybrid = searchParams.get("hybrid") !== "false";
  const urlRewrite = searchParams.get("rewrite") !== "false";

  const [query, setQuery] = useState(urlQuery);
  const [ragResult, setRagResult] = useState<RagResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(urlTemp);
  const [enableThinking, setEnableThinking] = useState<boolean>(urlThinking);
  const [useHybridSearch, setUseHybridSearch] = useState<boolean>(urlHybrid);
  const [rewrite, setRewrite] = useState<boolean>(urlRewrite);
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

  const fetchRagData = useCallback(async (searchString: string, tempParam: number, useThinking: boolean, hybridSearch: boolean, rewriteQuery: boolean) => {
    setLoading(true);
    setError(null);
    setRagResult(null);
    setThinkingText("");
    setAnswerText("");

    let fullText = "";
    let accumulatedThinking = "";
    let partialResult: RagResponse = {
      query: searchString,
      answer: "",
      sources: [],
      suggestedQuestions: [],
      rewrittenQuery: undefined,
    };

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${BASE_URL}/api/Ai/rag/ask`, {
        method: "POST",
        headers,
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          query: searchString,
          temperature: tempParam,
          enableThinking: useThinking,
          useHybridSearch: hybridSearch,
          rewrite: rewriteQuery
        })
      });

      if (!response.ok) {
        throw new Error(`Сталася помилка при пошуку (код ${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream not available");

      setLoading(false); // Прибираємо загальний індикатор, оскільки почався стрімінг
      setIsStreaming(true);

      const decoder = new TextDecoder();
      let buffer = "";

      setRagResult({ ...partialResult });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          let chunk = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');

          if (chunk.startsWith('data: ')) {
            chunk = chunk.slice(6);
          }

          if (chunk) {
            try {
              const data = JSON.parse(chunk);
              const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 30;

              if (isNearBottom) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
              }
              if (data.type === "error") {
                setError(data.data);
                setIsStreaming(false);
                return;
              } else if (data.type === "rewritten_query") {
                partialResult.rewrittenQuery = data.data;
                setRagResult({ ...partialResult });
              } else if (data.type === "sources") {
                partialResult.sources = data.data;
                setRagResult({ ...partialResult });
              } else if (data.type === "questions") {
                partialResult.suggestedQuestions = data.data;
                setRagResult({ ...partialResult });
              } else if (data.type === "thinking") {
                accumulatedThinking += data.text;
                setThinkingText(prev => prev + data.text);
              } else if (data.type === "answer") {
                setAnswerText(prev => prev + data.text);
                partialResult.answer += data.text;
                setRagResult({ ...partialResult });
              }
            } catch (e) {
              // ignore invalid json chunks
            }
          }
        }
      }

      // Save to cache
      const cacheKey = `${searchString}_${tempParam}_${useThinking}_${hybridSearch}_${rewriteQuery}`;
      setCachedResult(cacheKey, {
        ragResult: { ...partialResult },
        thinkingText: accumulatedThinking
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info("Генерацію зупинено користувачем.");
      } else if (fullText.length > 0 || partialResult.sources.length > 0) {
        toast.error("З'єднання перервано. Відповідь може бути неповною.");
        const errMsg = "\n\n[Помилка з'єднання: генерація перервана]";
        setAnswerText(prev => prev + errMsg);
        partialResult.answer = partialResult.answer + errMsg;
        setRagResult({ ...partialResult });
      } else {
        setError(err.message || "Сталася помилка при пошуку");
        setRagResult(null);
      }
      setIsStreaming(false);
      setLoading(false);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    setQuery(urlQuery);
    setTemperature(urlTemp);
    setEnableThinking(urlThinking);
    setUseHybridSearch(urlHybrid);
    setRewrite(urlRewrite);

    if (activeTour === "user_rag") {
      setRagResult(MOCK_RAG_RESPONSE);
      setLoading(false);
      setError(null);
    } else if (urlQuery.trim()) {
      const cacheKey = `${urlQuery}_${urlTemp}_${urlThinking}_${urlHybrid}_${urlRewrite}`;
      const cached = getCachedResult(cacheKey);
      if (cached) {
        setRagResult(cached.ragResult);
        setThinkingText(cached.thinkingText);
        setAnswerText(cached.ragResult.answer);
        setLoading(false);
        setError(null);
      } else {
        fetchRagData(urlQuery, urlTemp, urlThinking, urlHybrid, urlRewrite);
      }
    } else {
      setRagResult(null); // Clear results if URL is empty
      setThinkingText("");
      setAnswerText("");
    }
  }, [urlQuery, urlTemp, urlThinking, urlHybrid, urlRewrite, activeTour, fetchRagData]);

  const handleSearchSubmit = (newQuery: string) => {
    if (!newQuery.trim()) {
      setSearchParams({});
    } else {
      setSearchParams({
        q: newQuery.trim(),
        temp: temperature.toString(),
        thinking: enableThinking.toString(),
        hybrid: useHybridSearch.toString(),
        rewrite: rewrite.toString()
      });
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
                      checked={useHybridSearch}
                      onChange={(e) => setUseHybridSearch(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Гібридний пошук (BM25 + Вектор)"
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
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={rewrite}
                      onChange={(e) => setRewrite(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Покращити запит (Query Rewrite)"
                />
              </Box>
            </Stack>
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  const targetQuery = query.trim() || urlQuery.trim();
                  if (targetQuery) {
                    setSearchParams({
                      q: targetQuery,
                      temp: temperature.toString(),
                      thinking: enableThinking.toString(),
                      hybrid: useHybridSearch.toString(),
                      rewrite: rewrite.toString()
                    });
                  }
                }}
              >
                Застосувати налаштування
              </Button>
            </Box>
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
        <>
          <RagSearchView
            ref={ragResultRef}
            ragResponse={ragResult}
            thinkingText={thinkingText}
            answerText={answerText}
            onSearch={handleSearchSubmit}
            rewrittenQuery={ragResult.rewrittenQuery}
          />
          {isStreaming && (
            <Box sx={{ mt: 2, mb: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => {
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }
                }}
              >
                Зупинити генерацію
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default RagSearchPage;
