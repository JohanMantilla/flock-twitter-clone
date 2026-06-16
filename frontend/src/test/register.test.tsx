import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        register: async (email: string, password: string, username: string) => {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username }),
            });

            if (!res.ok) throw new Error('Error');
        },
        loading: false,
    }),
}));

import RegisterPage from '@/app/(auth)/register/page';
import { API_BASE_URL } from '@/constants/api';

describe('Register page', () => {
    it('renders all fields', () => {
        render(<RegisterPage />);

        expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('disables button when fields empty', () => {
        render(<RegisterPage />);

        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables button when form is valid', async () => {
        const user = userEvent.setup();
        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('johndoe'), 'testuser');
        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'Password1');

        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('registers user and redirects', async () => {
        const user = userEvent.setup();
        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('johndoe'), 'testuser');
        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'Password1');

        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/home');
        });
    });
});