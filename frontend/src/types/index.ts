export interface User {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}