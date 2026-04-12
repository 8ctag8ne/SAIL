export type SimpleTag = {
    id: number;
    title: string;
};

export type SimpleAuthor = {
    id: number;
    name: string;
};

export type SimpleBook = {
    id: number;
    title: string;
};

export type Book = {
    id: number;
    title: string;
    authors: SimpleAuthor[];
    imageUrl?: string;
    fileUrl?: string;
    info?: string;
    likesCount?: number;
    isLiked: boolean;
    tags: SimpleTag[];
    comments: Comment[];
};

export type Comment = {
    id: number;
    userId: string;
    userName?: string | null;
    bookId: number;
    createdAt: string;
    content: string;
    replyToId?: number | null;
    replies: Comment[];
};

export type Author = {
    id: number;
    name: string | null;
    imageUrl: string | null;
    info: string | null;
    books: Book[];
};

export type Tag = {
    id: number;
    title: string | null;
    info?: string | null;
    imageUrl?: string | null;
    booksCount?: number;
    books?: Book[];
};

export type User = {
    id: string;
    userName: string;
    email: string;
    about?: string;
    phoneNumber?: string;
    roles: string[];
};

export type BookList = {
    id: number;
    userId: string;
    title: string | null;
    description?: string | null;
    isPrivate?: boolean | null;
    books: SimpleBook[];
};

export interface RagSource {
    id: string; // Guid з бекенду
    bookId: number;
    title: string; // Назва книги
    pageStart: number;
    pageEnd: number;
    snippet: string; // Уривок тексту (Text з чанка)
}

export interface RagResponse {
    query: string;
    answer: string;
    sources: RagSource[];
    relatedTags: { id: number; title: string }[];
    suggestedQuestions: string[];
}
