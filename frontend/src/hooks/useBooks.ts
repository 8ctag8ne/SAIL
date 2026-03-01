import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooks, getBookById, toggleLike, addBook, updateBook, deleteBook } from '../api/BookApi';

export const useBooks = (query: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['books', query],
        queryFn: () => getBooks(query),
    });
};

export const useBook = (id: number) => {
    return useQuery({
        queryKey: ['books', id],
        queryFn: () => getBookById(id),
        enabled: !!id,
    });
};

export const useToggleLike = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (bookId: number) => toggleLike(bookId),
        onSuccess: (_, bookId) => {
            // Invalidate both lists and specific items
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['liked-books'] });
            queryClient.invalidateQueries({ queryKey: ['books', bookId] });
        },
    });
};

export const useAddBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FormData) => addBook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};

export const useUpdateBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => updateBook(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['books', variables.id] });
        },
    });
};

export const useDeleteBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteBook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};
