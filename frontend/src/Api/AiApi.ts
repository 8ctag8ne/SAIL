import instance from "./axios";

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
