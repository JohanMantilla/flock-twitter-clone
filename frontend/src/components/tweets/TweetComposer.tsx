'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Tweet } from '@/types';

const MAX = 280;

interface Props {
    userInitial: string;
}

export function TweetComposer({ userInitial }: Props) {
    const [content, setContent] = useState('');
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: () => api.post<Tweet>('/api/tweets', { content }),
        onSuccess: () => {
            setContent('');
            queryClient.invalidateQueries({ queryKey: ['timeline'] });
        },
    });

    const remaining = MAX - content.length;
    const counterColor =
        remaining < 0 ? 'text-red-500' :
            remaining < 20 ? 'text-red-400' :
                remaining < 40 ? 'text-yellow-500' :
                    'text-gray-400';

    return (
        <div className="flex gap-3 px-4 py-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                {userInitial}
            </div>

            <div className="flex-1">
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="What's happening?"
                    rows={3}
                    className="w-full resize-none text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                />

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className={`text-xs ${counterColor}`}>
                        {remaining}
                    </span>
                    <button
                        onClick={() => mutate()}
                        disabled={isPending || !content.trim() || content.length > MAX}
                        className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-full font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                    >
                        {isPending ? 'Posting...' : 'Tweet'}
                    </button>
                </div>
            </div>
        </div>
    );
}