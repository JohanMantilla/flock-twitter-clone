import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';

const mockUsersService = {
    findAll: jest.fn(),
    findByUsername: jest.fn(),
    updateMe: jest.fn(),
    search: jest.fn(),
    getStats: jest.fn(),
    getUserTweets: jest.fn(),
};

const mockUser = {
    id: 'uuid-123',
    email: 'test@test.com',
    username: 'testuser',
    displayName: 'testuser',
};

describe('UsersController', () => {
    let controller: UsersController;

    beforeEach(async () => {
        jest.resetAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockUsersService }],
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    describe('findOne', () => {
        it('should call usersService.findByUsername with the username', async () => {
            mockUsersService.findByUsername.mockResolvedValue(mockUser);

            const result = await controller.findOne('testuser');

            expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
            expect(result).toEqual(mockUser);
        });
    });

    describe('updateMe', () => {
        it('should call usersService.updateMe with the authenticated user id', async () => {
            const user = { id: 'uuid-123' } as any;
            const dto = { bio: 'new bio', avatarUrl: 'https://example.com/avatar.png' };
            const updatedUser = { id: 'uuid-123', ...dto };
            mockUsersService.updateMe.mockResolvedValue(updatedUser);

            const result = await controller.updateMe(user, dto);

            expect(mockUsersService.updateMe).toHaveBeenCalledWith('uuid-123', dto);
            expect(result).toEqual(updatedUser);
        });
    });

    describe('search', () => {
        it('should call usersService.search with query and currentUser id', async () => {
            const currentUser = { id: 'uuid-123' } as any;
            const searchResults = [
                { id: 'uuid-456', username: 'other', displayName: null, avatarUrl: null, isFollowing: false },
            ];
            mockUsersService.search.mockResolvedValue(searchResults);

            const result = await controller.search('other', currentUser);

            expect(mockUsersService.search).toHaveBeenCalledWith('other', 'uuid-123');
            expect(result).toEqual(searchResults);
        });

        it('should return empty array for empty query', async () => {
            const currentUser = { id: 'uuid-123' } as any;
            mockUsersService.search.mockResolvedValue([]);

            const result = await controller.search('', currentUser);

            expect(result).toEqual([]);
        });
    });

    describe('getStats', () => {
        it('should call usersService.getStats with username', async () => {
            const stats = { tweetsCount: 5, followersCount: 10, followingCount: 3 };
            mockUsersService.getStats.mockResolvedValue(stats);

            const result = await controller.getStats('testuser');

            expect(mockUsersService.getStats).toHaveBeenCalledWith('testuser');
            expect(result).toEqual(stats);
        });
    });

    describe('getUserTweets', () => {
        it('should call usersService.getUserTweets with username and pagination params', async () => {
            const tweets = { data: [], nextCursor: null, hasMore: false };
            mockUsersService.getUserTweets.mockResolvedValue(tweets);

            const result = await controller.getUserTweets('testuser', undefined, '20');

            expect(mockUsersService.getUserTweets).toHaveBeenCalledWith('testuser', undefined, 20);
            expect(result).toEqual(tweets);
        });
    });
});