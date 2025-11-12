// src/auth/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

// Mocks des services externes
const mockUserService = {
    // findByEmail est la méthode nécessaire pour l'authentification
    findByEmail: jest.fn(),
};

const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
};

// MOCK GLOBAL DE BCRYPTJS
jest.mock('bcryptjs', () => ({
    // Simuler la vérification du mot de passe
    compare: jest.fn(),
}));

describe('AuthService (TDD - Authentification)', () => {
    let service: AuthService;
    let userService: UserService;

    beforeEach(async () => {
        // Réinitialisation des mocks
        mockUserService.findByEmail.mockClear();
        (bcrypt.compare as jest.Mock).mockClear();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // TEST TDD 1 : Validation d'un utilisateur
    describe('validateUser', () => {
        const email = 'test@auth.com';
        const password = 'plainPassword';
        const userWithHashedPassword = {
            id: 1,
            email: email,
            password: 'hashedPassword123', // Haché
            balance: 100
        };

        it('should return the user object (excluding password) if validation succeeds', async () => {
            // 1. Simuler que l'utilisateur est trouvé par l'email
            (userService.findByEmail as jest.Mock).mockResolvedValue(userWithHashedPassword);
            // 2. Simuler que le mot de passe correspond
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            // L'appel à 'service.validateUser()' va échouer (méthode inexistante)
            const result = await service.validateUser(email, password);

            // Assertions
            // Le résultat DOIT OMETTRE le mot de passe pour des raisons de sécurité
            expect(result).toEqual({
                id: 1,
                email: email,
                balance: 100
                // PAS DE MOT DE PASSE
            });

            expect(userService.findByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, userWithHashedPassword.password);
        });

        it('should return null if password comparison fails', async () => {
            // 1. Simuler que l'utilisateur est trouvé par l'email
            (userService.findByEmail as jest.Mock).mockResolvedValue(userWithHashedPassword);
            // 2. Simuler que le mot de passe NE correspond PAS
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.validateUser(email, password);

            // Assertion : L'authentification échoue
            expect(result).toBeNull();
            expect(userService.findByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, userWithHashedPassword.password);
        });

        it('should return null if the user is not found', async () => {
            // 1. Simuler que l'utilisateur n'est PAS trouvé
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            // 2. Le compare ne devrait même pas être appelé

            const result = await service.validateUser(email, password);

            // Assertion : L'authentification échoue
            expect(result).toBeNull();
            expect(userService.findByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });
    });

    // TEST TDD 2 : Génération du JWT (Login)
    describe('login', () => {
        it('should return a JWT token and user info (excluding password)', async () => {
            const user = {
                id: 1,
                email: 'test@auth.com',
                balance: 100
            };
            const expectedToken = 'mocked-jwt-token';
            const expectedPayload = { email: user.email, sub: user.id }; // Le payload JWT

            // L'appel à 'service.login()' va échouer (méthode inexistante)
            const result = await service.login(user);

            // Assertions
            expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
            expect(result).toEqual({
                user: user, // Les données utilisateur
                access_token: expectedToken, // Le jeton JWT généré
            });
        });
    });

});