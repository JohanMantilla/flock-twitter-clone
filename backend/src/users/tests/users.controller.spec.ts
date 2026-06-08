import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';

const mockUsersService = {
    findAll: jest.fn(),
    findByUsername: jest.fn(),
    updateMe: jest.fn(),
};

describe('UsersController', () => {
    let controller: UsersController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockUsersService }],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        jest.clearAllMocks();
    });

    describe('findOne', () => {
        it('should call usersService.findByUsername with the username', async () => {
            const user = { username: 'testuser' };
            mockUsersService.findByUsername.mockResolvedValue(user);

            const result = await controller.findOne('testuser');

            expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
            expect(result).toEqual(user);
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
});