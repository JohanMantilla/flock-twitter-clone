'use client';

import { formatDistanceToNow } from 'date-fns';
import { Tweet } from '@/types';
import { LikeButton } from './LikeButton';

interface Props {
    tweet: Tweet;
    currentUserId?: string;
    onDelete?: (id: string) => void;
}

export function TweetCard({ tweet, currentUserId, onDelete }: Props) {
    const avatar = tweet.user.avatarUrl;
    const initial = tweet.user.username[0].toUpperCase();
    const isAuthor = currentUserId === tweet.user.id;

    return (
        <article className="flex gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="shrink-0">
                {avatar ? (
                    <img
                        src={avatar}
                        alt={tweet.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {initial}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-sm text-gray-900 truncate">
                            {tweet.user.displayName || tweet.user.username}
                        </span>
                        <span className="text-gray-400 text-sm shrink-0">
                            @{tweet.user.username}
                        </span>
                        <span className="text-gray-300 text-sm shrink-0">·</span>
                        <span className="text-gray-400 text-xs shrink-0">
                            {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
                        </span>
                    </div>

                    {isAuthor && onDelete && (
                        <button
                            onClick={() => {
                                if (confirm('Delete this tweet?')) onDelete(tweet.id);
                            }}
                            className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                            aria-label="Delete tweet"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>

                <p className="text-sm text-gray-900 mt-1 break-words leading-relaxed">
                    {tweet.content}
                </p>

                <div className="mt-2">
                    <LikeButton
                        tweetId={tweet.id}
                        initialLikesCount={tweet.likesCount}
                        initialLiked={tweet.liked}
                        currentUserId={currentUserId}
                    />
                </div>
            </div>
        </article>
    );
}