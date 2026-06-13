'use client';

import { useState } from 'react';
import { useFollow } from '@/hooks/useFollow';

interface Props {
    username: string;
    initialFollowing: boolean;
    currentUserId?: string;
    targetUserId: string;
}

export function FollowButton({
    username,
    initialFollowing,
    currentUserId,
    targetUserId,
}: Props) {
    const [following, setFollowing] = useState(initialFollowing);
    const [hovering, setHovering] = useState(false);
    const { follow, unfollow } = useFollow(username);

    // no mostrar si no hay usuario autenticado o es el mismo usuario
    if (!currentUserId || currentUserId === targetUserId) return null;

    const isPending = follow.isPending || unfollow.isPending;

    const handleClick = async () => {
        const prev = following;
        setFollowing(f => !f); // optimistic

        try {
            if (prev) {
                await unfollow.mutateAsync();
            } else {
                await follow.mutateAsync();
            }
        } catch (err: any) {
            setFollowing(prev); // revert on error
            console.error('Follow error:', err?.response?.data);
        }
    };

    const label = isPending
        ? '...'
        : following
            ? hovering ? 'Unfollow' : 'Following'
            : 'Follow';

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            disabled={isPending}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 min-w-[90px] ${following
                    ? hovering
                        ? 'border border-red-200 text-red-500 bg-red-50'
                        : 'border border-gray-200 text-gray-700 bg-white'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
        >
            {label}
        </button>
    );
}