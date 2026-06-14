'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { FollowButton } from '@/components/profile/FollowButton';
import { User } from '@/types';
import { useUserTweets } from '@/hooks/useUserTweets';
import { TweetCard } from '@/components/tweets/TweetCard';

interface Stats {
    tweetsCount: number;
    followersCount: number;
    followingCount: number;
}

interface FollowItem {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isFollowing: boolean;
}

type Tab = 'tweets' | 'followers' | 'following';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('tweets');
    const [followers, setFollowers] = useState<FollowItem[]>([]);
    const [following, setFollowing] = useState<FollowItem[]>([]);
    const [loadingTab, setLoadingTab] = useState(false);

    const {
        data: tweetsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingTweets,
    } = useUserTweets(username);

    const tweets = tweetsData?.pages.flatMap(p => p.data) ?? [];

    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();
        if (!node) return;
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
        });
        observer.current.observe(node);
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    useEffect(() => {
        if (!username) return;
        setLoading(true);

        Promise.all([
            api.get<User>(`/api/users/${username}`),
            api.get<Stats>(`/api/users/${username}/stats`),
        ])
            .then(([profileRes, statsRes]) => {
                setProfile(profileRes.data);
                setStats(statsRes.data);
            })
            .finally(() => setLoading(false));
    }, [username]);

    useEffect(() => {
        if (!profile || !currentUser) return;

        api.get<FollowItem[]>(`/api/users/${username}/followers`)
            .then(res => {
                setIsFollowing(res.data.some(f => f.id === currentUser.id));
            })
            .catch(() => { });
    }, [profile, currentUser, username]);

    useEffect(() => {
        if (activeTab === 'followers') {
            setLoadingTab(true);
            api.get<FollowItem[]>(`/api/users/${username}/followers`)
                .then(res => setFollowers(res.data))
                .finally(() => setLoadingTab(false));
        } else if (activeTab === 'following') {
            setLoadingTab(true);
            api.get<FollowItem[]>(`/api/users/${username}/following`)
                .then(res => setFollowing(res.data))
                .finally(() => setLoadingTab(false));
        }
    }, [activeTab, username]);

    if (loading) {
        return (
            <div className="animate-pulse p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-100" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-6 text-center text-gray-500 text-sm">
                User not found
            </div>
        );
    }

    const initial = profile.username[0].toUpperCase();

    return (
        <div>
            <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 py-3">
                <h1 className="text-lg font-medium text-gray-900">
                    {profile.displayName || profile.username}
                </h1>
                {stats && (
                    <p className="text-xs text-gray-400">{stats.tweetsCount} tweets</p>
                )}
            </div>

            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                    {profile.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt={profile.username}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-medium text-gray-600">
                            {initial}
                        </div>
                    )}

                    <FollowButton
                        username={profile.username}
                        initialFollowing={isFollowing}
                        currentUserId={currentUser?.id}
                        targetUserId={profile.id}
                    />
                </div>

                <p className="font-semibold text-gray-900">
                    {profile.displayName || profile.username}
                </p>
                <p className="text-sm text-gray-400 mb-2">@{profile.username}</p>

                {profile.bio && (
                    <p className="text-sm text-gray-700 mb-3">{profile.bio}</p>
                )}

                {stats && (
                    <div className="flex gap-4 text-sm">
                        <button
                            onClick={() => setActiveTab('following')}
                            className="hover:underline"
                        >
                            <strong className="text-gray-900">{stats.followingCount}</strong>
                            <span className="text-gray-400 ml-1">Following</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('followers')}
                            className="hover:underline"
                        >
                            <strong className="text-gray-900">{stats.followersCount}</strong>
                            <span className="text-gray-400 ml-1">Followers</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex border-b border-gray-100">
                {(['tweets', 'followers', 'following'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                            ? 'text-gray-900 border-b-2 border-gray-900'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loadingTab && (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
            )}

            {activeTab === 'tweets' && (
                <div>
                    {isLoadingTweets && (
                        <div className="space-y-0">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex gap-3 px-4 py-3 border-b border-gray-100 animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                                        <div className="h-3 bg-gray-100 rounded w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoadingTweets && tweets.length === 0 && (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No tweets yet
                        </div>
                    )}

                    {tweets.map(tweet => (
                        <TweetCard
                            key={tweet.id}
                            tweet={tweet}
                            currentUserId={currentUser?.id}
                        />
                    ))}

                    <div ref={sentinelRef} className="h-4" />

                    {isFetchingNextPage && (
                        <div className="px-4 py-3 text-center">
                            <span className="text-xs text-gray-400">Loading more...</span>
                        </div>
                    )}
                </div>
            )}

            {!loadingTab && activeTab === 'followers' && (
                <div>
                    {followers.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No followers yet
                        </div>
                    ) : (
                        followers.map(f => (
                            <UserRow key={f.id} user={f} currentUserId={currentUser?.id} />
                        ))
                    )}
                </div>
            )}

            {!loadingTab && activeTab === 'following' && (
                <div>
                    {following.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            Not following anyone yet
                        </div>
                    ) : (
                        following.map(f => (
                            <UserRow key={f.id} user={f} currentUserId={currentUser?.id} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function UserRow({ user, currentUserId }: { user: FollowItem; currentUserId?: string }) {
    const initial = user.username[0].toUpperCase();

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
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

            <FollowButton
                username={user.username}
                initialFollowing={user.isFollowing}
                currentUserId={currentUserId}
                targetUserId={user.id}
            />
        </div>
    );
}