'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Props {
    tweetId: string;
    initialLikesCount: number;
    initialLiked: boolean;
    currentUserId?: string;
}

export function LikeButton({
    tweetId,
    initialLikesCount,
    initialLiked,
    currentUserId,
}: Props) {
    const [liked, setLiked] = useState(initialLiked);
    const [likesCount, setLikesCount] = useState(initialLikesCount);

    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (liked) {
                const res = await api.delete<{ likesCount: number }>(
                    `/api/tweets/${tweetId}/like`
                );

                return {
                    liked: false,
                    likesCount: res.data.likesCount,
                };
            }

            const res = await api.post<{ likesCount: number }>(
                `/api/tweets/${tweetId}/like`
            );

            return {
                liked: true,
                likesCount: res.data.likesCount,
            };
        },

        onSuccess: (data) => {
            setLiked(data.liked);
            setLikesCount(data.likesCount);
        },

        onError: (error: any) => {
            console.error(
                'Like error:',
                error?.response?.data ?? error
            );
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ['timeline'],
            });
        },
    });

    if (!currentUserId) {
        return (
            <div className="flex items-center gap-1 text-gray-400">
                <HeartIcon filled={false} />
                <span className="text-xs">{likesCount}</span>
            </div>
        );
    }

    return (
        <button
            onClick={() => mutate()}
            disabled={isPending}
            className={`flex items-center gap-1 transition-colors ${liked
                    ? 'text-red-500 hover:text-red-400'
                    : 'text-gray-400 hover:text-red-400'
                }`}
            aria-label={liked ? 'Unlike' : 'Like'}
        >
            <HeartIcon filled={liked} />
            <span className="text-xs">{likesCount}</span>
        </button>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    if (filled) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
        </svg>
    );
}