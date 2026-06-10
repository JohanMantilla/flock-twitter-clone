import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { LikesService } from '../likes.service';
import { Like } from '../entities/like.entity';
import { Tweet } from '../../tweets/entities/tweet.entity';

describe('LikesService', () => {
    let service: LikesService;

    const likeRepo = {
        findOne: jest.fn(),
        remove: jest.fn(),
    };

    const tweetRepo = {
        findOneBy: jest.fn(),
    };

    const manager = {
        save: jest.fn(),
        remove: jest.fn(),
        increment: jest.fn(),
        decrement: jest.fn(),
    };

    const dataSource = {
        transaction: jest.fn(),
    };

    const currentUser = {
        id: 'user-id',
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();

        dataSource.transaction.mockImplementation(
            async (callback: any) => callback(manager),
        );

        service = new LikesService(
            likeRepo as any,
            tweetRepo as any,
            dataSource as any,
        );
    });

    describe('like', () => {
        it('creates like and returns incremented likesCount', async () => {
            tweetRepo.findOneBy
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 5,
                })
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 6,
                });

            likeRepo.findOne.mockResolvedValue(null);

            const result = await service.like(
                currentUser,
                'tweet-id',
            );

            expect(result).toEqual({
                likesCount: 6,
            });
        });

        it('throws 404 if tweet does not exist', async () => {
            tweetRepo.findOneBy.mockResolvedValue(null);

            await expect(
                service.like(currentUser, 'missing'),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws 400 if already liked', async () => {
            tweetRepo.findOneBy.mockResolvedValue({
                id: 'tweet-id',
                likesCount: 1,
            });

            likeRepo.findOne.mockResolvedValue({
                id: 'like-id',
            });

            await expect(
                service.like(currentUser, 'tweet-id'),
            ).rejects.toThrow(BadRequestException);
        });

        it('uses transaction with manager.save and manager.increment', async () => {
            tweetRepo.findOneBy
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 0,
                })
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 1,
                });

            likeRepo.findOne.mockResolvedValue(null);

            await service.like(
                currentUser,
                'tweet-id',
            );

            expect(manager.save).toHaveBeenCalledWith(
                Like,
                {
                    user_id: currentUser.id,
                    tweet_id: 'tweet-id',
                },
            );

            expect(manager.increment).toHaveBeenCalledWith(
                Tweet,
                { id: 'tweet-id' },
                'likesCount',
                1,
            );
        });
    });

    describe('unlike', () => {
        it('removes like and returns decremented likesCount', async () => {
            const like = {
                id: 'like-id',
            };

            tweetRepo.findOneBy
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 5,
                })
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 4,
                });

            likeRepo.findOne.mockResolvedValue(like);

            const result = await service.unlike(
                currentUser,
                'tweet-id',
            );

            expect(result).toEqual({
                likesCount: 4,
            });
        });

        it('throws 404 if tweet does not exist', async () => {
            tweetRepo.findOneBy.mockResolvedValue(null);

            await expect(
                service.unlike(currentUser, 'missing'),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws 400 if not liked', async () => {
            tweetRepo.findOneBy.mockResolvedValue({
                id: 'tweet-id',
                likesCount: 5,
            });

            likeRepo.findOne.mockResolvedValue(null);

            await expect(
                service.unlike(currentUser, 'tweet-id'),
            ).rejects.toThrow(BadRequestException);
        });

        it('does not decrement below zero', async () => {
            const like = {
                id: 'like-id',
            };

            tweetRepo.findOneBy.mockResolvedValue({
                id: 'tweet-id',
                likesCount: 0,
            });

            likeRepo.findOne.mockResolvedValue(like);

            const result = await service.unlike(
                currentUser,
                'tweet-id',
            );

            expect(likeRepo.remove).toHaveBeenCalledWith(like);

            expect(result).toEqual({
                likesCount: 0,
            });
        });

        it('uses transaction with manager.remove and manager.decrement', async () => {
            const like = {
                id: 'like-id',
            };

            tweetRepo.findOneBy
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 5,
                })
                .mockResolvedValueOnce({
                    id: 'tweet-id',
                    likesCount: 4,
                });

            likeRepo.findOne.mockResolvedValue(like);

            await service.unlike(
                currentUser,
                'tweet-id',
            );

            expect(manager.remove).toHaveBeenCalledWith(
                Like,
                like,
            );

            expect(manager.decrement).toHaveBeenCalledWith(
                Tweet,
                { id: 'tweet-id' },
                'likesCount',
                1,
            );
        });
    });
});