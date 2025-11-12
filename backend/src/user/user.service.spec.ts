import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

// MOCK GLOBAL DU SERVICE PRISMA
const prismaServiceMock = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// MOCK GLOBAL DE BCRYPT
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn(),
}));

describe('UserService (TDD - Gestion Utilisateur)', () => {
  let service: UserService;
  // let prisma: PrismaService;

  beforeEach(async () => {
    // Réinitialisation des mocks entre chaque test
    Object.values(prismaServiceMock.user).forEach(mockFn => mockFn.mockClear());
    (bcrypt.hash as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    // prisma = module.get<PrismaService>(PrismaService); // Utile si l'on voulait tester directement prisma
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TEST TDD 1 : Création d'un utilisateur avec cryptage du mot de passe
  it('should hash the password and successfully create a new user', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'plainPassword',
      balance: 1000,
    };

    const expectedResult = {
      id: 1,
      email: createUserDto.email,
      password: 'hashedPassword123', // Le mot de passe haché mocké
      balance: 1000
    };

    // 1. Simuler que la création réussit
    prismaServiceMock.user.create.mockResolvedValue(expectedResult);

    // L'appel à 'service.create()' va échouer (méthode inexistante)
    const result = await service.create(createUserDto);

    // Assertions
    expect(result).toEqual(expectedResult);

    // S'assurer que bcrypt.hash a été appelé avec le mot de passe clair
    expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);

    // S'assurer que prisma.user.create a été appelé avec le mot de passe HACHÉ
    expect(prismaServiceMock.user.create).toHaveBeenCalledWith({
      data: {
        email: createUserDto.email,
        password: 'hashedPassword123', // Doit être le mot de passe haché
        balance: createUserDto.balance,
      },
      // AJOUTER LE BLOC 'select' POUR MATCHÉ L'APPEL DU SERVICE
      select: {
        id: true,
        email: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  // TEST TDD 2 : Recherche d'un utilisateur par email (pour le login)
  it('should find a user by email and include the hashed password', async () => {
    const userWithPassword = {
      id: 2,
      email: 'login@test.com',
      password: 'hashedPassword123', // Le mot de passe HACHÉ est inclus ici
      balance: 500
    };

    // 1. Simuler que la recherche trouve l'utilisateur
    prismaServiceMock.user.findUnique.mockResolvedValue(userWithPassword);

    const emailToFind = 'login@test.com';

    // L'appel à 'service.findByEmail()' va échouer (méthode inexistante)
    const result = await service.findByEmail(emailToFind);

    // Assertions
    expect(result).toEqual(userWithPassword);

    // S'assurer que prisma.user.findUnique a été appelé
    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: emailToFind },
      select: {
        id: true,
        email: true,
        password: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

});