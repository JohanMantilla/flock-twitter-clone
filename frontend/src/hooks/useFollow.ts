import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useFollow(username: string) {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['profile', username] });
        queryClient.invalidateQueries({ queryKey: ['followers', username] });
        queryClient.invalidateQueries({ queryKey: ['following', username] });
    };

    const follow = useMutation({
        mutationFn: () =>
            api.post(`/api/users/${username}/follow`).then(r => r.data),
        onSettled: invalidate,
    });

    const unfollow = useMutation({
        mutationFn: () =>
            api.delete(`/api/users/${username}/follow`).then(r => r.data),
        onSettled: invalidate,
    });

    return { follow, unfollow };
}