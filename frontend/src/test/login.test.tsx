import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => '/login',
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        login: async (email: string, password: string) => {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) throw new Error('Invalid credentials');
        },
        loading: false,
    }),
}));

import LoginPage from '@/app/(auth)/login/page';

describe('Login page', () => {
    it('renders email and password fields', () => {
        render(<LoginPage />);

        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('submit button is disabled when fields are empty', () => {
        render(<LoginPage />);

        const button = screen.getByRole('button', { name: /sign in/i });
        expect(button).toBeDisabled();
    });

    it('submit button enables when both fields are filled', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'Password1');

        expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
    });

    it('calls login and redirects to /home on success', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'Password1');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/home');
        });
    });

    it('shows error message on invalid credentials', async () => {
        server.use(
            http.post('http://localhost:3000/api/auth/login', () => {
                return HttpResponse.json(
                    { message: 'Invalid credentials' },
                    { status: 401 },
                );
            }),
        );

        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('you@example.com'), 'wrong@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('button shows loading state while submitting', async () => {
        server.use(
            http.post('http://localhost:3000/api/auth/login', async () => {
                await new Promise(r => setTimeout(r, 100));
                return HttpResponse.json({ user: {}, token: 'tok' });
            }),
        );

        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'Password1');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
});