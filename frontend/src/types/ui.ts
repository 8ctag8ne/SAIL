import { Book, Tag } from './entities';

export type PdfPreview = {
    blob: Blob;
    url: string;
};

export type CheatSheet = {
    tips: string[];
    books: Book[];
    tags: Tag[];
};

export type BookAnalysisResult = {
    title: string;
    authors: { id: number; name: string }[];
    description: string;
    existingTags: { id: number; title: string }[];
    suggestedTags: string[];
};
