import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
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
});

