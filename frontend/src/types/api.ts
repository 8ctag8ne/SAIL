import { Book, SimpleBook, SimpleAuthor, SimpleTag, Author, Tag, Comment } from './entities';

export type BookCreate = {
    id: number;
    title: string;
    authorIds: number[];
    info?: string;
    image?: File;
    file?: File;
    tagIds: number[];
};

export type BookUpdate = {
    title?: string;
    authorIds: number[];
    info?: string;
    image?: File;
    file?: File;
    tagIds: number[];
};

export type PaginatedBooks = {
    map(arg0: (b: any) => { id: any; title: any; }): import("react").SetStateAction<SimpleBook[]>;
    items: Book[];
    totalPages: number;
};

export type PaginatedTags = {
    map(arg0: (b: any) => { id: any; title: any; }): import("react").SetStateAction<SimpleTag[]>;
    items: Tag[];
    totalPages: number;
}

export type PaginatedAuthors = {
    map(arg0: (b: any) => { id: any; title: any; }): import("react").SetStateAction<SimpleAuthor[]>;
    items: Author[];
    totalPages: number;
};

export type AuthorCreate = {
    name: string;
    image?: File;
    info?: string;
};

export type AuthorUpdate = {
    name?: string;
    image?: File;
    info?: string;
};

export type TagCreate = {
    title: string;
    info?: string;
    image?: File;
    bookIds: number[];
};

export type TagUpdate = {
    title?: string;
    info?: string;
    image?: File;
    bookIds: number[];
};

export interface AuthResponse {
    id: string;
    token: string;
    userName: string;
    roles: string[];
}

export type BookDetailsData = Book & {
    fileUrl?: string;
    comments: Comment[];
};

// Extracted from original Api/CommentApi.ts
export type CommentCreate = {
    content: string;
    bookId: number;
    replyToId?: number | null;
};

// Extracted from original Api/CommentApi.ts
export type CommentUpdate = {
    content: string;
};

// Extracted from original Api/BookListApi.ts
export type BookListCreate = {
    title: string;
    description?: string;
    isPrivate?: boolean;
    bookIds: number[];
};

// Extracted from original Api/BookListApi.ts
export type BookListUpdate = {
    title?: string;
    description?: string;
    isPrivate?: boolean;
    bookIds: number[];
};
