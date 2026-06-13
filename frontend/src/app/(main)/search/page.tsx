'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { FollowButton } from '@/components/profile/FollowButton';

interface SearchUser {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 400);
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const { data: results = [], isLoading } = useQuery<SearchUser[]>({
        queryKey: ['search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return [];
            const res = await api.get<SearchUser[]>('/api/users/search', {
                params: { q: debouncedQuery },
            });
            return res.data;
        },
        enabled: debouncedQuery.length >= 1,
        staleTime: 30_000,
    });

    return (
        <div>
            <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 py-3">
                <h1 className="text-lg font-medium text-gray-900 mb-3">Search</h1>
                <div className="relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search users..."
                        autoFocus
                        className="w-full bg-gray-50 border border-gray-100 rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:border-gray-300 focus:bg-white transition-colors"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div>
                {!query && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        Search for users by name or username
                    </div>
                )}

                {query && isLoading && (
                    <div className="space-y-0">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {query && !isLoading && results.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No users found for "{query}"
                    </div>
                )}

                {results.map(user => {
                    const initial = user.username[0].toUpperCase();
                    return (
                        <div
                            key={user.id}
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/profile/${user.username}`)}
                        >
                            <div className="flex items-center gap-3">
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.username}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                        {initial}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.displayName || user.username}
                                    </p>
                                    <p className="text-xs text-gray-400">@{user.username}</p>
                                </div>
                            </div>

                            <div onClick={e => e.stopPropagation()}>
                                <FollowButton
                                    username={user.username}
                                    initialFollowing={false}
                                    currentUserId={currentUser?.id}
                                    targetUserId={user.id}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}