import { Author, Book, BookList, SimpleAuthor, SimpleBook, SimpleTag, Tag, User } from './entities';

// Props for Reusable Multi-Selects & Inputs
export type TagMultiSelectProps = {
    selectedTags: SimpleTag[];
    onChange: (tags: SimpleTag[]) => void;
};

export type BookMultiSelectProps = {
    selectedBooks: SimpleBook[];
    onChange: (books: SimpleBook[]) => void;
    excludeBookId?: number;
};

export type BookSearchMultiSelectProps = {
    selectedBooks: SimpleBook[];
    onChange: (books: SimpleBook[]) => void;
};

export type SingleAuthorSelectProps = {
    selectedAuthorId: number | null;
    onChange: (authorId: number | null) => void;
};

export type TagNameMultiInputProps = {
    tags: string[];
    onChange: (tags: string[]) => void;
};

export type SearchBarProps = {
    onSearch: (query: string) => void;
    width?: string;
    onFilterClick?: () => void;
};

export type AdvancedSearchProps = {
    onSearch: (params: { query: string; authorId?: number; tagIds?: number[] }) => void;
    onClose: () => void;
};

// Props for Entity Cards
export type AuthorCardProps = {
    author: Author;
};

export type BookCardProps = {
    book: Book;
    onLikeToggle?: (bookId: number) => void;
};

export type BookListCardProps = {
    bookList: BookList;
};

export type TagCardProps = {
    tag: Tag;
};

export type UserCardProps = {
    user: User;
    onRoleUpdate: (userId: string, targetRole: string, currentRoles: string[], action: "add" | "remove") => void;
    onDelete: (userId: string) => void;
};

export type GenericCardProps = {}; // e.g. from generic Card component

// Props for Forms
export type AuthorFormProps = {
    initialData?: Author;
    onSubmit: (data: FormData) => Promise<void>;
};

export type BookFormProps = {
    initialData?: Book;
    onSubmit: (data: FormData) => Promise<void>;
};

export type TagFormProps = {
    initialData?: Tag;
    onSubmit: (data: FormData) => Promise<void>;
};

// Props for Detail Views
export type AuthorDetailsProps = {
    author: Author;
};

export type BookDetailsProps = {
    fileUrl?: string;
    bookId: number;
    initialLikesCount: number;
    initialIsLiked: boolean;
};

export type CheatSheetViewProps = {
    cheatSheetData: {
        tips: string[];
        books: Book[];
        tags: Tag[];
    };
};

export type CommentSectionProps = {
    bookId: number;
};

// Props for Modals/Dialogs
export type AddBookToListsDialogProps = {
    bookId: number;
    open: boolean;
    onClose: () => void;
};

export type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
};

// Props for Layout Components
export type PageContainerProps = {
    children: React.ReactNode;
};

export type BooksPageComponentProps = {
    title: string;
    apiCall: (params: any) => Promise<any>;
};

// Props for Buttons
export type CreateBookListButtonProps = {
    onSuccess?: () => void;
};
