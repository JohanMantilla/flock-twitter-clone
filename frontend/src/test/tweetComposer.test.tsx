import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

const invalidateMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: invalidateMock,
    }),
    useMutation: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}));

import { TweetComposer } from '@/components/tweets/TweetComposer';

describe('TweetComposer', () => {
    it('renders textarea and button', () => {
        render(<TweetComposer userInitial="J" />);

        expect(screen.getByPlaceholderText(/what's happening/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /tweet/i })).toBeInTheDocument();
    });

    it('disables button when empty', () => {
        render(<TweetComposer userInitial="J" />);

        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
    });

    it('updates character counter', async () => {
        const user = userEvent.setup();
        render(<TweetComposer userInitial="J" />);

        const textarea = screen.getByPlaceholderText(/what's happening/i);

        await user.type(textarea, 'hello');

        expect(screen.getByText('275')).toBeInTheDocument();
    });
});