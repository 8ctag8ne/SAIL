import instance from "./axios";
import { BookAnalysisResult, CheatSheet } from "../types";

// Рендер першої сторінки PDF (залишаємо як було)
export const renderPdfFirstPage = async (file: File): Promise<Blob> => {
  const formData = new FormData();
  formData.append("File", file);
  const res = await instance.post("/Pdf/render-first-page", formData, {
    responseType: "blob",
  });
  return res.data as Blob;
};

// OCR (витяг тексту з PDF, за замовчуванням 10 сторінок)
export const extractPdfText = async (file: File, pageCount: number = 10): Promise<string> => {
  const formData = new FormData();
  formData.append("PdfFile", file);
  formData.append("PageCount", pageCount.toString());
  const res = await instance.post("/Pdf/ocr", formData, {
    responseType: "text",
  });
  return res.data as string;
};

// Аналіз книги (автоматичне визначення назви, автора, тегів тощо)
export const analyzeBookPdf = async (file: File, pageCount: number = 10): Promise<BookAnalysisResult> => {
  const formData = new FormData();
  formData.append("PdfFile", file);
  formData.append("PageCount", pageCount.toString());
  const res = await instance.post<BookAnalysisResult>("/Pdf/analyze-book", formData);
  console.log("Analyze book response:", res.data);
  return res.data;
};

export const getCheatSheet = async (userRequest: string): Promise<CheatSheet> => {
  const res = await instance.post<CheatSheet>("/Pdf/search-by-request", userRequest, {
    headers: { "Content-Type": "application/json" },
  });
  if(res.status !== 200) {
    console.log("Error:", res.status, res.statusText);
  }
  console.log(res.data);
  return res.data;
};