import BASE_URL from '../config';

export interface BookMarkdownDto {
    id: number;
    bookId: number;
    content: string;
}

export const getMarkdownByBookId = async (bookId: number): Promise<BookMarkdownDto> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/api/BookMarkdown/${bookId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) {
        if (response.status === 404) return { id: 0, bookId, content: "" };
        throw new Error('Failed to fetch markdown');
    }
    return response.json();
};

export const createMarkdown = async (bookId: number, content: string): Promise<BookMarkdownDto> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/api/BookMarkdown/${bookId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(content)
    });

    if (!response.ok) throw new Error('Failed to create markdown');
    return response.json();
};

export const updateMarkdown = async (bookId: number, content: string): Promise<BookMarkdownDto> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/api/BookMarkdown/${bookId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(content)
    });

    if (!response.ok) throw new Error('Failed to update markdown');
    return response.json();
};

export const autoParsePdfToMarkdown = async (bookId: number): Promise<{ taskId: string, status: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/api/Ai/rag/parse-pdf/${bookId}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) throw new Error('Failed to start PDF parsing');
    const data = await response.json();
    return { taskId: data.task_id || data.taskId, status: data.status };
};

export const getParseStatus = async (taskId: string): Promise<{ status: string, error?: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/api/Ai/rag/parse-pdf/status/${taskId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) throw new Error('Failed to get parse status');
    return response.json();
};
