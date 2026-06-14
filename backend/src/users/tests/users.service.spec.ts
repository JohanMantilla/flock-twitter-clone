import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Follow } from '../../follows/entities/follow.entity';
import { UsersService } from '../users.service';

const mockUser = {
    id: 'uuid-123',
    email: 'test@test.com',
    password: 'hashed-password',
    username: 'testuser',
    displayName: 'testuser',
    bio: 'hello',
    avatarUrl: 'https://example.com/avatar.png',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
};

const mockUserRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    manager: {
        getRepository: jest.fn(() => ({
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        })),
    },
};

const mockFollowRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('UsersService', () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: getRepositoryToken(Follow), useValue: mockFollowRepository },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        jest.clearAllMocks();
        mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockFollowRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    describe('findByUsername', () => {
        it('should normalize the username and return the matching user', async () => {
            mockUserRepository.findOneBy.mockResolvedValue(mockUser);

            const result = await service.findByUsername('  TESTUSER  ');

            expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ username: 'testuser' });
            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundException when the user does not exist', async () => {
            mockUserRepository.findOneBy.mockResolvedValue(null);

            await expect(service.findByUsername('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateMe', () => {
        it('should update the current user profile', async () => {
            const dto = { bio: 'updated bio', avatarUrl: 'https://example.com/new.png' };
            mockUserRepository.preload.mockResolvedValue({ ...mockUser, ...dto });
            mockUserRepository.save.mockResolvedValue({ ...mockUser, ...dto });

            const result = await service.updateMe('uuid-123', dto);

            expect(mockUserRepository.preload).toHaveBeenCalledWith({ id: 'uuid-123', ...dto });
            expect(mockUserRepository.save).toHaveBeenCalled();
            expect(result).toEqual({ ...mockUser, ...dto });
        });

        it('should throw NotFoundException when the current user does not exist', async () => {
            mockUserRepository.preload.mockResolvedValue(null);

            await expect(
                service.updateMe('missing-id', { bio: 'updated bio' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException on unique constraint violation', async () => {
            const dto = { bio: 'updated bio' };
            mockUserRepository.preload.mockResolvedValue({ ...mockUser, ...dto });
            mockUserRepository.save.mockRejectedValue({
                code: '23505',
                detail: 'Key (username)=(testuser) already exists.',
            });

            await expect(service.updateMe('uuid-123', dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('search', () => {
        it('should return users with isFollowing field', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([mockUser]);
            mockQueryBuilder.select.mockReturnThis();

            const result = await service.search('testuser', 'other-user-id');

            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty('isFollowing');
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('username');
        });

        it('should return empty array for empty query', async () => {
            const result = await service.search('', 'user-id');
            expect(result).toEqual([]);
        });

        it('should return empty array for whitespace query', async () => {
            const result = await service.search('   ', 'user-id');
            expect(result).toEqual([]);
        });
    });

    describe('getStats', () => {
        it('should return tweet, follower and following counts', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'uuid-123' });
            mockUserRepository.query
                .mockResolvedValueOnce([{ count: '5' }])
                .mockResolvedValueOnce([{ count: '10' }])
                .mockResolvedValueOnce([{ count: '3' }]);

            const result = await service.getStats('testuser');

            expect(result).toEqual({
                tweetsCount: 5,
                followersCount: 10,
                followingCount: 3,
            });
        });

        it('should throw NotFoundException when user does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(service.getStats('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getUserTweets', () => {
        it('should return paginated tweets for a user', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'uuid-123' });
            const mockTweet = {
                id: 'tweet-1',
                content: 'hello',
                likesCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 'uuid-123',
                    username: 'testuser',
                    displayName: 'testuser',
                    avatarUrl: null,
                },
            };
            mockQueryBuilder.getMany.mockResolvedValue([mockTweet]);

            const result = await service.getUserTweets('testuser');

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('nextCursor');
            expect(result).toHaveProperty('hasMore');
            expect(result.hasMore).toBe(false);
        });

        it('should throw NotFoundException when user does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(service.getUserTweets('missing')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for invalid cursor', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'uuid-123' });

            await expect(
                service.getUserTweets('testuser', 'not-a-date'),
            ).rejects.toThrow(BadRequestException);
        });
    });
});