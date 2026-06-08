import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUser = {
    id: 'uuid-123',
    email: 'test@test.com',
    password: bcrypt.hashSync('Password1', 10),
    username: 'testuser',
    displayName: 'testuser',
    bio: null,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
};

const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
    });

    describe('validateUser', () => {
        it('should return user without password when credentials are valid', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.validateUser('test@test.com', 'Password1');

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty('password');
            expect(result.email).toBe('test@test.com');
        });

        it('should return null when user is not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const result = await service.validateUser('noexiste@test.com', 'Password1');

            expect(result).toBeNull();
        });

        it('should return null when password is incorrect', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.validateUser('test@test.com', 'WrongPassword1');

            expect(result).toBeNull();
        });

        it('should throw UnauthorizedException when user is inactive', async () => {
            mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

            await expect(
                service.validateUser('test@test.com', 'Password1')
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        const createUserDto = {
            email: 'nuevo@test.com',
            password: 'Password1',
            username: 'nuevousuario',
        };

        it('should register a new user and return token', async () => {
            mockUserRepository.findOneBy.mockResolvedValue(null);
            mockUserRepository.create.mockReturnValue({ ...mockUser, ...createUserDto });
            mockUserRepository.save.mockResolvedValue({ ...mockUser, ...createUserDto });

            const result = await service.register(createUserDto);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user).not.toHaveProperty('password');
            expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
        });

        it('should throw BadRequestException when email already exists', async () => {
            mockUserRepository.findOneBy.mockResolvedValue(mockUser);

            await expect(service.register(createUserDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should hash the password before saving', async () => {
            mockUserRepository.findOneBy.mockResolvedValue(null);
            mockUserRepository.create.mockImplementation((dto) => dto);
            mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

            await service.register(createUserDto);

            const createCall = mockUserRepository.create.mock.calls[0][0];
            expect(createCall.password).not.toBe(createUserDto.password);
            expect(bcrypt.compareSync(createUserDto.password, createCall.password)).toBe(true);
        });

        it('should set displayName to username by default', async () => {
            mockUserRepository.findOneBy.mockResolvedValue(null);
            mockUserRepository.create.mockImplementation((dto) => dto);
            mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

            await service.register(createUserDto);

            const createCall = mockUserRepository.create.mock.calls[0][0];
            expect(createCall.displayName).toBe(createUserDto.username);
        });
    });

    describe('login', () => {
        it('should return user and token when credentials are valid', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await service.login({
                email: 'test@test.com',
                password: 'Password1',
            });

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.token).toBe('mock.jwt.token');
        });

        it('should throw UnauthorizedException when credentials are invalid', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                service.login({ email: 'test@test.com', password: 'WrongPass1' })
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});