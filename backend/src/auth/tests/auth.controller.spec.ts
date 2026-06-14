import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
};

const mockAuthResponse = {
    user: {
        id: 'uuid-123',
        email: 'test@test.com',
        username: 'testuser',
        displayName: 'testuser',
    },
    token: 'mock.jwt.token',
};

const mockUser = {
    id: 'uuid-123',
    email: 'test@test.com',
    username: 'testuser',
    displayName: 'testuser',
    bio: null,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('AuthController', () => {
    let controller: AuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should call authService.register with correct dto', async () => {
            const dto = { email: 'test@test.com', password: 'Password1', username: 'testuser' };
            mockAuthService.register.mockResolvedValue(mockAuthResponse);

            const result = await controller.register(dto);

            expect(mockAuthService.register).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockAuthResponse);
        });
    });

    describe('login', () => {
        it('should call authService.login with correct dto', async () => {
            const dto = { email: 'test@test.com', password: 'Password1' };
            mockAuthService.login.mockResolvedValue(mockAuthResponse);

            const result = await controller.login(dto);

            expect(mockAuthService.login).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockAuthResponse);
        });
    });

    describe('getProfile', () => {
        it('should call authService.getMe with userId and return user', async () => {
            mockAuthService.getMe.mockResolvedValue(mockUser);

            const result = await controller.getProfile('uuid-123');

            expect(mockAuthService.getMe).toHaveBeenCalledWith('uuid-123');
            expect(result).toEqual(mockUser);
            expect(result).not.toHaveProperty('password');
        });
    });
});