import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { FollowsService } from '../follows.service';

describe('FollowsService', () => {
    let service: FollowsService;

    const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
    };

    const followRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
        followRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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

            const result = await service.follow(currentUser, 'target');

            expect(followRepo.create).toHaveBeenCalledWith({
                follower_id: currentUser.id,
                following_id: targetUser.id,
            });
            expect(followRepo.save).toHaveBeenCalledWith(follow);
            expect(result).toEqual({ success: true, following: true });
        });

        it('throws 404 if target user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.follow(currentUser, 'missing'),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws 400 on self follow', async () => {
            userRepo.findOne.mockResolvedValue({ id: currentUser.id });

            await expect(
                service.follow(currentUser, 'john'),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws 400 if already following', async () => {
            userRepo.findOne.mockResolvedValue({ id: 'target-id' });
            followRepo.findOne.mockResolvedValue({ id: 'follow-id' });

            await expect(
                service.follow(currentUser, 'target'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('unfollow', () => {
        it('removes an existing follow', async () => {
            const targetUser = { id: 'target-id' };
            userRepo.findOne.mockResolvedValue(targetUser);
            followRepo.findOne.mockResolvedValue({ id: 'follow-id' });

            const result = await service.unfollow(currentUser, 'target');

            expect(followRepo.delete).toHaveBeenCalledWith({
                follower_id: currentUser.id,
                following_id: targetUser.id,
            });
            expect(result).toEqual({ success: true, following: false });
        });

        it('throws 404 if target user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.unfollow(currentUser, 'missing'),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws 404 if not following', async () => {
            userRepo.findOne.mockResolvedValue({ id: 'target-id' });
            followRepo.findOne.mockResolvedValue(null);

            await expect(
                service.unfollow(currentUser, 'target'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getFollowers', () => {
        it('returns followers with isFollowing field', async () => {
            userRepo.findOne.mockResolvedValue({ id: 'target-id' });

            const mockFollows = [
                {
                    follower: {
                        id: 'follower-1',
                        username: 'follower1',
                        displayName: 'Follower One',
                        avatarUrl: null,
                    },
                },
            ];

            mockQueryBuilder.getMany
                .mockResolvedValueOnce(mockFollows) // getFollowers query
                .mockResolvedValueOnce([]);          // getMyFollowingIdsAmong query

            const result = await service.getFollowers('target', 'user-id');

            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('username');
            expect(result[0]).toHaveProperty('displayName');
            expect(result[0]).toHaveProperty('avatarUrl');
            expect(result[0]).toHaveProperty('isFollowing');
            expect(result[0].isFollowing).toBe(false);
        });

        it('returns isFollowing true when current user follows the follower', async () => {
            userRepo.findOne.mockResolvedValue({ id: 'target-id' });

            const mockFollows = [
                {
                    follower: {
                        id: 'follower-1',
                        username: 'follower1',
                        displayName: null,
                        avatarUrl: null,
                    },
                },
            ];

            mockQueryBuilder.getMany
                .mockResolvedValueOnce(mockFollows)
                .mockResolvedValueOnce([{ following_id: 'follower-1' }]);

            const result = await service.getFollowers('target', 'user-id');

            expect(result[0].isFollowing).toBe(true);
        });

        it('throws 404 if user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getFollowers('missing', 'user-id'),
            ).rejects.toThrow(NotFoundException);
        });

        it('returns empty array when no followers', async () => {
            userRepo.findOne.mockResolvedValue({ id: 'target-id' });
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.getFollowers('target', 'user-id');

            expect(result).toEqual([]);
        });
    });

    describe('getFollowing', () => {
        it('returns following list with isFollowing field', async () => {
            userRepo.findOne.mockResolvedValue({ id: 'user-id' });

            const mockFollows = [
                {
                    following: {
                        id: 'following-1',
                        username: 'following1',
                        displayName: 'Following One',
                        avatarUrl: null,
                    },
                },
            ];

            mockQueryBuilder.getMany
                .mockResolvedValueOnce(mockFollows)
                .mockResolvedValueOnce([]);

            const result = await service.getFollowing('john', 'user-id');

            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('username');
            expect(result[0]).toHaveProperty('isFollowing');
        });

        it('throws 404 if user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getFollowing('missing', 'user-id'),
            ).rejects.toThrow(NotFoundException);
        });

        it('returns empty array when not following anyone', async () => {
            userRepo.findOne.mockResolvedValue({ id: 'user-id' });
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.getFollowing('john', 'user-id');

            expect(result).toEqual([]);
        });
    });
});