import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthors, getAuthorById, addAuthor, updateAuthor, deleteAuthor } from '../Api/AuthorApi';
import { AuthorCreate, AuthorUpdate } from '../types';

export const useAuthors = (query: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['authors', query],
        queryFn: () => getAuthors(query),
    });
};

export const useAuthor = (id: number) => {
    return useQuery({
        queryKey: ['authors', id],
        queryFn: () => getAuthorById(id),
        enabled: !!id,
    });
};

export const useAddAuthor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AuthorCreate) => addAuthor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['authors'] });
        },
    });
};

export const useUpdateAuthor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: AuthorUpdate }) => updateAuthor(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['authors'] });
            queryClient.invalidateQueries({ queryKey: ['authors', id] });
        },
    });
};

export const useDeleteAuthor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteAuthor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['authors'] });
        },
    });
};
