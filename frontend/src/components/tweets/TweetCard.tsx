import { formatDistanceToNow } from 'date-fns';
import { Tweet } from '@/types';

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
                            <i className="ti ti-trash text-sm" aria-hidden="true" />
                        </button>
                    )}
                </div>

                <p className="text-sm text-gray-900 mt-1 break-words leading-relaxed">
                    {tweet.content}
                </p>

                <div className="flex items-center gap-1 mt-2 text-gray-400">
                    <i className="ti ti-heart text-sm" aria-hidden="true" />
                    <span className="text-xs">{tweet.likesCount}</span>
                </div>
            </div>
        </article>
    );
}