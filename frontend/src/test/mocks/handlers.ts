import { API_BASE_URL } from '@/constants/api';
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
    http.post(`${API_BASE_URL}/api/auth/login`, () => {
        return HttpResponse.json({ user: mockUser, token: 'mock-token' });
    }),

    http.post(`${API_BASE_URL}/api/auth/register`, () => {
        return HttpResponse.json({ user: mockUser, token: 'mock-token' });
    }),

    http.get(`${API_BASE_URL}/api/auth/me`, () => {
        return HttpResponse.json(mockUser);
    }),

    http.get(`${API_BASE_URL}/api/tweets/timeline`, () => {
        return HttpResponse.json({ data: [], nextCursor: null, hasMore: false });
    }),

    http.post(`${API_BASE_URL}/api/tweets`, () => {
        return HttpResponse.json({
            id: 'tweet-uuid-1',
            content: 'Hello world',
            likesCount: 0,
            createdAt: new Date().toISOString(),
            user: mockUser,
        });
    }),

    http.post(`${API_BASE_URL}/api/tweets/:id/like`, () => {
        return HttpResponse.json({ likesCount: 1 });
    }),

    http.post(`${API_BASE_URL}/api/users/:username/follow`, () => {
        return HttpResponse.json({ success: true, following: true });
    }),
];