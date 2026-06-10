import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { FollowsService } from '../follows.service';

describe('FollowsService', () => {
    let service: FollowsService;

    const followRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    const userRepo = {
        findOne: jest.fn(),
    };

    const currentUser = {
        id: 'user-id',
        username: 'john',
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();

        service = new FollowsService(
            followRepo as any,
            userRepo as any,
        );
    });

    describe('follow', () => {
        it('creates a valid follow', async () => {
            const targetUser = { id: 'target-id' };

            userRepo.findOne.mockResolvedValue(targetUser);
            followRepo.findOne.mockResolvedValue(null);

            const follow = {
                follower_id: currentUser.id,
                following_id: targetUser.id,
            };

            followRepo.create.mockReturnValue(follow);

            const result = await service.follow(
                currentUser,
                'target',
            );

            expect(followRepo.create).toHaveBeenCalledWith({
                follower_id: currentUser.id,
                following_id: targetUser.id,
            });

            expect(followRepo.save).toHaveBeenCalledWith(follow);

            expect(result).toEqual({
                success: true,
                following: true,
            });
        });

        it('throws 404 if target user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.follow(currentUser, 'missing'),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws 400 on self follow', async () => {
            userRepo.findOne.mockResolvedValue({
                id: currentUser.id,
            });

            await expect(
                service.follow(currentUser, 'john'),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws 400 if already following', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'target-id',
            });

            followRepo.findOne.mockResolvedValue({
                id: 'follow-id',
            });

            await expect(
                service.follow(currentUser, 'target'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('unfollow', () => {
        it('removes an existing follow', async () => {
            const targetUser = { id: 'target-id' };

            userRepo.findOne.mockResolvedValue(targetUser);

            followRepo.findOne.mockResolvedValue({
                id: 'follow-id',
            });

            const result = await service.unfollow(
                currentUser,
                'target',
            );

            expect(followRepo.delete).toHaveBeenCalledWith({
                follower_id: currentUser.id,
                following_id: targetUser.id,
            });

            expect(result).toEqual({
                success: true,
                following: false,
            });
        });

        it('throws 404 if target user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.unfollow(currentUser, 'missing'),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws 404 if not following', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'target-id',
            });

            followRepo.findOne.mockResolvedValue(null);

            await expect(
                service.unfollow(currentUser, 'target'),
            ).rejects.toThrow(NotFoundException);
        });
    });
});