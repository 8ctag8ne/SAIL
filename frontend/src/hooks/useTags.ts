import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTags, getTagById, addTag, updateTag, deleteTag } from '../api/TagApi';
import { TagCreate, TagUpdate } from '../types';

export const useTags = (query: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['tags', query],
        queryFn: () => getTags(query),
    });
};

export const useTag = (id: number) => {
    return useQuery({
        queryKey: ['tags', id],
        queryFn: () => getTagById(id),
        enabled: !!id,
    });
};

export const useAddTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TagCreate) => addTag(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
};

export const useUpdateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TagUpdate }) => updateTag(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['tags', id] });
        },
    });
};

export const useDeleteTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteTag(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
};
