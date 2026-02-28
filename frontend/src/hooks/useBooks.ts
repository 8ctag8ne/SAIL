import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooks, getBookById, toggleLike } from '../Api/BookApi';

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
        },
    });
};
