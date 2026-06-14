import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

const followMock = vi.fn();
const unfollowMock = vi.fn();

vi.mock('@/hooks/useFollow', () => ({
    useFollow: () => ({
        follow: { mutateAsync: followMock, isPending: false },
        unfollow: { mutateAsync: unfollowMock, isPending: false },
    }),
}));

describe('FollowButton', () => {
    it('renders follow button when not following', async () => {
        const { FollowButton } = await import('@/components/profile/FollowButton');

        render(
            <FollowButton
                username="testuser"
                initialFollowing={false}
                currentUserId="1"
                targetUserId="2"
            />
        );

        expect(screen.getByText(/follow/i)).toBeInTheDocument();
    });

    it('calls follow on click', async () => {
        const user = userEvent.setup();
        const { FollowButton } = await import('@/components/profile/FollowButton');

        render(
            <FollowButton
                username="testuser"
                initialFollowing={false}
                currentUserId="1"
                targetUserId="2"
            />
        );

        await user.click(screen.getByRole('button'));
        expect(followMock).toHaveBeenCalled();
    });
});