import { http, HttpResponse } from 'msw';

const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    bio: null,
    avatarUrl: null,
};

export const handlers = [
    http.post('http://localhost:3000/api/auth/login', () => {
        return HttpResponse.json({ user: mockUser, token: 'mock-token' });
    }),

    http.post('http://localhost:3000/api/auth/register', () => {
        return HttpResponse.json({ user: mockUser, token: 'mock-token' });
    }),

    http.get('http://localhost:3000/api/auth/me', () => {
        return HttpResponse.json(mockUser);
    }),

    http.get('http://localhost:3000/api/tweets/timeline', () => {
        return HttpResponse.json({ data: [], nextCursor: null, hasMore: false });
    }),

    http.post('http://localhost:3000/api/tweets', () => {
        return HttpResponse.json({
            id: 'tweet-uuid-1',
            content: 'Hello world',
            likesCount: 0,
            createdAt: new Date().toISOString(),
            user: mockUser,
        });
    }),

    http.post('http://localhost:3000/api/tweets/:id/like', () => {
        return HttpResponse.json({ likesCount: 1 });
    }),

    http.post('http://localhost:3000/api/users/:username/follow', () => {
        return HttpResponse.json({ success: true, following: true });
    }),
];