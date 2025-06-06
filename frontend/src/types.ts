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
    info?: string;
    likesCount?: number;
    isLiked: boolean;
    tags: SimpleTag[];
    comments: Comment[];
  };

  export type BookCreate = {
  id: number;
  title: string;
  authorIds: number[];
  info?: string;
  image?: File;
  file?: File;
  tagIds: number[];
  // інші поля за потреби
};

export type BookUpdate = {
  title?: string;
  authorIds: number[];
  info?: string;
  image?: File;
  file?: File;
  tagIds: number[];
  // інші поля за потреби
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

  export type BookDetailsData = Book & {
    fileUrl?: string;
    comments: Comment[];
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

  export type Author = {
    id: number;
    name: string | null;
    imageUrl: string | null;
    info: string | null;
    books: Book[]; // Використовуємо тип Book, якщо він уже визначений
  };
  
  // Тип для створення автора (AuthorCreateDto)
  export type AuthorCreate = {
    name: string;
    image?: File; // Використовуємо File для завантаження зображення
    info?: string;
  };
  
  // Тип для оновлення автора (AuthorUpdateDto)
  export type AuthorUpdate = {
    name?: string;
    image?: File; // Використовуємо File для завантаження зображення
    info?: string;
  };

export type Tag = {
    id: number;
    title: string | null;
    info?: string | null;
    imageUrl?: string | null;
    books: Book[]; // Book вже є у вашому types.ts
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

export type PdfPreview = {
  blob: Blob;
  url: string;
};

export type BookAnalysisResult = {
  title: string;
  authors: SimpleAuthor[];
  description: string;
  existingTags: SimpleTag[];
  suggestedTags: string[];
};

export type CheatSheet = {
  tips: string[];
  books: Book[];
  tags: Tag[];
};

