import instance from "./axios";
import { RagResponse, RagRequest } from "../types";

export const startMetadataExtraction = async (file: File): Promise<{ task_id: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await instance.post("/Ai/extract-metadata", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data as any;
};

export const checkMetadataStatus = async (taskId: string): Promise<{ status: string; metadata?: any; error?: string }> => {
    const response = await instance.get(`/Ai/extract-metadata/status/${taskId}`);
    return response.data as any;
};

export const askRagQuestion = async (query: string, temperature: number = 0.7): Promise<RagResponse> => {
    const request: RagRequest = { query, temperature };
    const response = await instance.post('/Ai/rag/ask', request);
    return response.data as any;
};
export const processBookForRag = async (bookId: number): Promise<{ taskId: string, status: string }> => {
    const response = await instance.post(`/Ai/rag/process-book/${bookId}`);
    return {
        taskId: (response.data as any).task_id,
        status: (response.data as any).status,
    };
};

export const getProcessBookStatus = async (taskId: string): Promise<{ taskId: string, status: string, error?: string }> => {
    const response = await instance.get(`/Ai/rag/process-book/status/${taskId}`);
    return {
        taskId: (response.data as any).task_id,
        status: (response.data as any).status,
        error: (response.data as any).error
    };
};

export interface RagQuota {
    dailyLimit: number | null;
    remaining: number | null;
    used: number;
    isUnlimited: boolean;
    resetAt: string;
    secondsUntilReset: number;
}

export const getRagQuota = async (): Promise<RagQuota> => {
    const response = await instance.get<RagQuota>("/Ai/rag/quota");
    return response.data;
};

export const formatTimeUntilReset = (seconds: number): string => {
    if (seconds <= 0) return "найближчим часом";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return `${hours} год. ${minutes} хв.`;
    } else if (hours > 0) {
        return `${hours} год.`;
    } else {
        return `${Math.max(1, minutes)} хв.`;
    }
};

