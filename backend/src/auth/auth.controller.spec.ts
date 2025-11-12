// src/auth/auth.controller.spec.ts (Contenu complet du test de la dernière étape)

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';

// Mock du AuthService
const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
};

describe('AuthController (TDD - Login)', () => {
    let controller: AuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService, // Utilisation du mock
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);

        // Nettoyage des mocks avant chaque test
        mockAuthService.login.mockClear();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // TEST TDD 1 : POST /auth/login
    it('should call authService.login and return the user and JWT token on success', async () => {
        const userPayload: LoginUserDto = {
            email: 'test@login.com',
            password: 'testPassword',
        };
        const userWithoutPassword = {
            id: 1,
            email: userPayload.email,
            balance: 100,
        };
        const expectedAuthResult = {
            user: userWithoutPassword,
            access_token: 'mocked-jwt-token'
        };

        mockAuthService.login.mockResolvedValue(expectedAuthResult);

        // L'appel à 'controller.login()' va échouer (méthode inexistante)
        const result = await controller.login({ user: userWithoutPassword });

        // Assertions
        expect(mockAuthService.login).toHaveBeenCalledWith(userWithoutPassword);
        expect(result).toEqual(expectedAuthResult);
    });
});