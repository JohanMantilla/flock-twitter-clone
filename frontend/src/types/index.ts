export interface User {
    id: string;
    email: string;
    username: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    createdAt?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface TweetUser {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export interface Tweet {
    id: string;
    content: string;
    likesCount: number;
    createdAt: string;
    user: TweetUser;
}

export interface TimelineResponse {
    data: Tweet[];
    nextCursor: string | null;
    hasMore: boolean;
}