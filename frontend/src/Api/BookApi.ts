import instance from "./axios";
import { Book, BookDetailsData, PaginatedBooks } from "../types";

// Пошук та пагінація книг
export const getBooks = async (query: Record<string, any> = {}): Promise<PaginatedBooks> => {
    const queryString = new URLSearchParams(query).toString();
    const res = await instance.get<PaginatedBooks>(`/Book?${queryString}`);
    return res.data;
};

// Отримати книгу з деталями
export const getBookById = async (id: number): Promise<BookDetailsData> => {
    const res = await instance.get<BookDetailsData>(`/Book/${id}`);
    return res.data;
};

// Додати книгу
export const addBook = async (book: FormData): Promise<Book> => {
    const res = await instance.post<Book>(`/Book`, book);
    return res.data;
};

// Оновити книгу
export const updateBook = async (id: number, book: FormData): Promise<Book> => {
    const res = await instance.put<Book>(`/Book/${id}`, book);
    return res.data;
};

// Видалити книгу
export const deleteBook = async (id: number): Promise<void> => {
    await instance.delete(`/Book/${id}`);
};

// Лайк/дизлайк книги
export const toggleLike = async (bookId: number): Promise<{ LikesCount: number; IsLiked: boolean }> => {
    const res = await instance.post<{ LikesCount: number; IsLiked: boolean }>(`/Book/${bookId}/toggle-like`);
    return res.data;
};

// Отримати вподобані книги для конкретного користувача
export const getLikedBooksForUser = async (userId: string): Promise<Book[]> => {
    const res = await instance.get<Book[]>(`/Book/get-liked-books/${userId}`);
    return res.data;
};

// Отримати ідентифікатори списків книг, у які входить книга для поточного користувача
export const getBookListIdsForBook = async (bookId: number): Promise<number[]> => {
    const res = await instance.get<number[]>(`/Book/${bookId}/user-booklists`);
    return res.data;
};

export const downloadBookFile = async (id: number): Promise<void> => {
    const res = await instance.get(`/Book/${id}/download`, {
        responseType: "blob",
    });

    let fileName = "book";
    const disposition = res.headers["content-disposition"];
    if (disposition) {
        // Спочатку шукаємо filename*= (UTF-8)
        const utf8Match = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf8Match) {
            fileName = decodeURIComponent(utf8Match[1]);
        } else {
            // Якщо немає, шукаємо filename=
            const asciiMatch = disposition.match(/filename\s*=\s*"?([^";]+)"?/i);
            if (asciiMatch) {
                fileName = asciiMatch[1];
            }
        }
    }

    const url = window.URL.createObjectURL(res.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};