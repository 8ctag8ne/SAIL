import { useQuery } from '@tanstack/react-query';
import { getLikedBooksForUser } from '../api/BookApi';

export const useLikedBooks = (userId?: string) => {
    return useQuery({
        queryKey: ['liked-books', userId],
        queryFn: () => getLikedBooksForUser(userId!),
        enabled: !!userId,
    });
};
