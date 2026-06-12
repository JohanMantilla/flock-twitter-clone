import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TimelineResponse } from '@/types';

export function useTimeline() {
    return useInfiniteQuery<TimelineResponse>({
        queryKey: ['timeline'],
        queryFn: async ({ pageParam }) => {
            const params: Record<string, string> = { limit: '20' };
            if (pageParam) params.cursor = pageParam as string;
            const res = await api.get<TimelineResponse>('/api/tweets/timeline', { params });
            return res.data;
        },
        initialPageParam: undefined,
        getNextPageParam: last => last.nextCursor ?? undefined,
    });
}