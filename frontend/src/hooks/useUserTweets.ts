import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TimelineResponse } from '@/types';

export function useUserTweets(username: string) {
    return useInfiniteQuery<TimelineResponse>({
        queryKey: ['userTweets', username],
        queryFn: async ({ pageParam }) => {
            const params: Record<string, string> = { limit: '20' };
            if (pageParam) params.cursor = pageParam as string;
            const res = await api.get<TimelineResponse>(
                `/api/users/${username}/tweets`,
                { params }
            );
            return res.data;
        },
        initialPageParam: undefined,
        getNextPageParam: last => last.nextCursor ?? undefined,
    });
}