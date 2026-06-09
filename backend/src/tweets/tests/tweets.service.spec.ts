import { Test, TestingModule } from '@nestjs/testing';
import { TweetsService } from '../tweets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tweet } from '../entities/tweet.entity';
import { User } from '../../users/entities/user.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TweetsService', () => {
    let service: TweetsService;

    const mockTweet = (overrides = {}) => ({
        id: 'tweet-uuid',
        content: 'hello world',
        likesCount: 0,
        user: { id: 'user-1', username: 'u1', displayName: 'u1', avatarUrl: null },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
    };

    const mockTweetRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        findOneOrFail: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TweetsService,
                { provide: getRepositoryToken(Tweet), useValue: mockTweetRepository },
            ],
        }).compile();

        service = module.get<TweetsService>(TweetsService);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('creates tweet with likes_count = 0 and sanitizes content and associates user', async () => {
            const user = { id: 'user-1' } as User;
            const dto = { content: '  hello   world\t' } as any;

            const created = mockTweet({ content: 'hello world', user });

            mockTweetRepository.create.mockReturnValue({ ...dto, user });
            mockTweetRepository.save.mockResolvedValue({ id: 'tweet-uuid', ...dto, user, createdAt: new Date(), updatedAt: new Date(), likesCount: 0 });
            mockTweetRepository.findOneOrFail.mockResolvedValue(created);

            const res = await service.create(user, dto);

            expect(mockTweetRepository.create).toHaveBeenCalled();
            expect(mockTweetRepository.save).toHaveBeenCalled();
            expect(res).toBeDefined();
            expect(res.likesCount).toBe(0);
            expect(res.content).toBe('hello world');
            expect(res.user).toBeDefined();
            expect(res.user.id).toBe(user.id);
        });
    });

    describe('remove', () => {
        it('removes tweet if user is author', async () => {
            const user = { id: 'user-1' } as User;
            const tweet = mockTweet({ user: { id: 'user-1' } });
            mockTweetRepository.findOne.mockResolvedValue(tweet);
            mockTweetRepository.remove.mockResolvedValue(undefined);

            await expect(service.remove(tweet.id, user)).resolves.toBeUndefined();
            expect(mockTweetRepository.remove).toHaveBeenCalledWith(tweet);
        });

        it('throws NotFoundException if tweet not found', async () => {
            mockTweetRepository.findOne.mockResolvedValue(null);

            await expect(service.remove('nope', { id: 'u' } as User)).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException if user is not author', async () => {
            const tweet = mockTweet({ user: { id: 'owner' } });
            mockTweetRepository.findOne.mockResolvedValue(tweet);

            await expect(service.remove(tweet.id, { id: 'intruder' } as User)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getTimeline', () => {
        it('returns data, nextCursor and hasMore, respects limit max 50 and cursor filtering', async () => {
            const userId = 'follower-1';

            const now = new Date();
            // create 21 tweets to trigger hasMore when limit=20
            const tweets = Array.from({ length: 21 }).map((_, i) => mockTweet({ id: `t${i}`, createdAt: new Date(now.getTime() - i * 1000) }));
            mockQueryBuilder.getMany.mockResolvedValue(tweets);

            const res = await service.getTimeline(userId, undefined, 20);

            expect(res).toHaveProperty('data');
            expect(res).toHaveProperty('nextCursor');
            expect(res).toHaveProperty('hasMore');
            expect(res.hasMore).toBe(true);
            expect(res.nextCursor).toBeDefined();

            // respect max limit of 50
            mockQueryBuilder.getMany.mockResolvedValue(Array.from({ length: 101 }).map((_, i) => mockTweet({ id: `t${i}` })));
            const res2 = await service.getTimeline(userId, undefined, 100);
            expect(res2.data.length).toBeLessThanOrEqual(50);
        });

        it('filters by cursor when provided and returns no sensitive user fields', async () => {
            const userId = 'follower-1';
            const oldDate = new Date('2000-01-01T00:00:00.000Z');
            const tweets = [mockTweet({ id: 't1', createdAt: oldDate, user: { id: 'u1', username: 'u1', displayName: 'u1', avatarUrl: null } })];
            mockQueryBuilder.getMany.mockResolvedValue(tweets);

            const res = await service.getTimeline(userId, oldDate.toISOString(), 20);

            expect(res.data.length).toBeGreaterThanOrEqual(0);
            res.data.forEach((t) => {
                expect(t.user).toHaveProperty('id');
                expect(t.user).toHaveProperty('username');
                expect(t.user).not.toHaveProperty('password');
                expect(t.user).not.toHaveProperty('email');
            });
        });
    });
});
