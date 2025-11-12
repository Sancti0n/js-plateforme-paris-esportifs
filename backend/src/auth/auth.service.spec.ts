import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// --- Mocks des Dépendances ---

// Mock complet du module bcrypt (utilisé pour la comparaison de mots de passe)
jest.mock('bcrypt', () => ({
    compare: jest.fn(),
}));

const jwtServiceMock = {
    sign: jest.fn().mockReturnValue('mocked_jwt_token'),
};

const userServiceMock = {
    // findOneByEmail corrigé
    findOneByEmail: jest.fn(),
};

// --- Données de Test ---

const email = 'test@example.com';
const password = 'password123';
// 🟢 CORRECTION : ID est un string (UUID) et tous les champs sont présents
const userPayload = { id: 'user-id-1', email, username: 'testuser', balance: 0 };

// L'objet utilisateur tel que retourné par la DB (contient le hash)
const userWithHashedPassword = {
    ...userPayload,
    // Simuler le retour de Prisma (Decimal) et le champ password_hash
    balance: { toNumber: () => 0 },
    password_hash: 'hashedPassword123',
};

// Utilisateur simplifié pour les tests (sans la méthode toNumber)
const userForTest = { ...userPayload, balance: userWithHashedPassword.balance.toNumber() };


describe('AuthService', () => {
    let service: AuthService;
    let userService: UserService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: userServiceMock,
                },
                {
                    provide: JwtService,
                    useValue: jwtServiceMock,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        jwtService = module.get<JwtService>(JwtService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // --------------------------------------------------------------------------------------
    // validateUser
    // --------------------------------------------------------------------------------------
    describe('validateUser', () => {
        it('should return the user (without hash) if password matches (GREEN)', async () => {
            // Setup: Utilisateur trouvé, mot de passe correct
            (userService.findOneByEmail as jest.Mock).mockResolvedValue(userWithHashedPassword);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            // Execute
            const result = await service.validateUser(email, password);

            // Assertions
            expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, userWithHashedPassword.password_hash);

            // Le résultat correspond au userPayload après traitement du Decimal
            expect(result).toEqual(userForTest);
        });

        it('should return null if user is not found', async () => {
            // Setup: Utilisateur non trouvé
            (userService.findOneByEmail as jest.Mock).mockResolvedValue(null);

            // Execute
            const result = await service.validateUser(email, password);

            // Assertions
            expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should return null if password does not match', async () => {
            // Setup: Utilisateur trouvé, mot de passe incorrect
            (userService.findOneByEmail as jest.Mock).mockResolvedValue(userWithHashedPassword);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            // Execute
            const result = await service.validateUser(email, password);

            // Assertions
            expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, userWithHashedPassword.password_hash);
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------------------
    // login (Génère le JWT)
    // --------------------------------------------------------------------------------------
    describe('login', () => {
        it('should return a JWT token and user info', async () => {
            // Execute
            const result = await service.login(userForTest);

            // Assertions
            expect(jwtService.sign).toHaveBeenCalledWith({ email: userForTest.email, sub: userForTest.id });

            expect(result).toEqual({
                access_token: 'mocked_jwt_token',
                user: userForTest,
            });
        });
    });
});