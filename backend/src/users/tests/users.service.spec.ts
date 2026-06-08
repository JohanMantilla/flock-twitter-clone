import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

const mockUser = {
    id: 'uuid-123',
    email: 'test@test.com',
    password: 'hashed-password',
    username: 'testuser',
    display_name: 'testuser',
    bio: 'hello',
    avatar_url: 'https://example.com/avatar.png',
    isActive: true,
    created_at: new Date(),
    updated_at: new Date(),
};

const mockUserRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    preload: jest.fn(),
    save: jest.fn(),
};

describe('UsersService', () => {
    let service: UsersService;
    let userRepository: jest.Mocked<Partial<Repository<User>>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        userRepository = module.get(getRepositoryToken(User));
        jest.clearAllMocks();
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
            const dto = { bio: 'updated bio', avatar_url: 'https://example.com/new.png' };
            mockUserRepository.preload.mockResolvedValue({ ...mockUser, ...dto });
            mockUserRepository.save.mockResolvedValue({ ...mockUser, ...dto });

            const result = await service.updateMe('uuid-123', dto);

            expect(mockUserRepository.preload).toHaveBeenCalledWith({
                id: 'uuid-123',
                ...dto,
            });
            expect(mockUserRepository.save).toHaveBeenCalled();
            expect(result).toEqual({ ...mockUser, ...dto });
        });

        it('should throw NotFoundException when the current user does not exist', async () => {
            mockUserRepository.preload.mockResolvedValue(null);

            await expect(
                service.updateMe('missing-id', { bio: 'updated bio' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when bio/avatar save conflicts with unique constraints', async () => {
            const dto = { bio: 'updated bio' };
            mockUserRepository.preload.mockResolvedValue({ ...mockUser, ...dto });
            mockUserRepository.save.mockRejectedValue({
                code: '23505',
                detail: 'Key (username)=(testuser) already exists.',
            });

            await expect(service.updateMe('uuid-123', dto)).rejects.toThrow(BadRequestException);
        });
    });
});