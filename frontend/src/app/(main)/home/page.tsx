'use client';

import { useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTimeline } from '@/hooks/useTimeline';
import { TweetCard } from '@/components/tweets/TweetCard';
import { TweetComposer } from '@/components/tweets/TweetComposer';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function HomePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch,
    } = useTimeline();

    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();
        if (!node) return;
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });
        observer.current.observe(node);
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    const handleDelete = async (tweetId: string) => {
        await api.delete(`/api/tweets/${tweetId}`);
        queryClient.invalidateQueries({ queryKey: ['timeline'] });
    };

    const tweets = data?.pages.flatMap(p => p.data) ?? [];
    const userInitial = user?.username?.[0]?.toUpperCase() ?? '?';

    return (
        <div>
            <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 py-3">
                <h1 className="text-lg font-medium text-gray-900">Home</h1>
            </div>

            <TweetComposer userInitial={userInitial} />

            {isLoading && (
                <div className="space-y-0">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-3 px-4 py-3 border-b border-gray-100 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                                <div className="h-3 bg-gray-100 rounded w-full" />
                                <div className="h-3 bg-gray-100 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isError && (
                <div className="px-4 py-8 text-center">
                    <p className="text-gray-500 text-sm mb-3">Failed to load timeline</p>
                    <button
                        onClick={() => refetch()}
                        className="text-sm text-gray-900 underline underline-offset-2"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!isLoading && tweets.length === 0 && (
                <div className="px-4 py-12 text-center">
                    <p className="text-gray-500 text-sm">
                        Follow someone to see their tweets here
                    </p>
                </div>
            )}

            {tweets.map(tweet => (
                <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    currentUserId={user?.id}
                    onDelete={handleDelete}
                />
            ))}

            <div ref={sentinelRef} className="h-4" />

            {isFetchingNextPage && (
                <div className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-400">Loading more...</span>
                </div>
            )}
        </div>
    );
}