import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


// --- Mocks des Dépendances ---

// MOCK GLOBAL DE BCRYPT
jest.mock('bcrypt', () => ({
  hash: jest.fn(), // On mocke la fonction hash
}));

// 🟢 CORRECTION CRITIQUE : Le mock de PrismaService doit contenir la propriété 'users'
const prismaServiceMock = {
  users: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Mock pour la transaction (si utilisée)
  $transaction: jest.fn((callback) => callback(prismaServiceMock)),
};

// --- Données de Test ---

const mockCreateUserDto: CreateUserDto = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
};

// Utilisateur retourné par Prisma (simulant l'objet retourné)
const mockUser = {
  id: 'uuid-12345',
  username: mockCreateUserDto.username,
  email: mockCreateUserDto.email,
  password_hash: 'hashedPassword123',
  balance: { toNumber: () => 100 }, // Simule le type Decimal de Prisma
  created_at: new Date(),
  updated_at: new Date(),
};

// Utilisateur sans mot de passe (format retourné par le service)
const mockUserWithoutPassword = {
  id: mockUser.id,
  username: mockUser.username,
  email: mockUser.email,
  balance: 100, // Format number après conversion
};


describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Nettoyer les mocks avant chaque test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock, // Injection du mock
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);

    // Setup par défaut pour les tests réussis
    (bcrypt.hash as jest.Mock).mockResolvedValue(mockUser.password_hash);
    prismaServiceMock.users.create.mockResolvedValue(mockUser);
    prismaServiceMock.users.findUnique.mockResolvedValue(mockUser);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --------------------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------------------
  describe('create', () => {
    it('should call bcrypt.hash, create user with hashed password, and return the user (GREEN)', async () => {
      // Setup
      const expectedUserData = {
        username: mockCreateUserDto.username,
        email: mockCreateUserDto.email,
        password_hash: mockUser.password_hash,
      };

      // Execute
      const result = await service.create(mockCreateUserDto);

      // Assertions
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(prismaServiceMock.users.create).toHaveBeenCalledWith({ data: expectedUserData });
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should throw ConflictException if user email already exists (simulated by findUnique)', async () => {
      // Simuler que l'utilisateur existe déjà lors de la recherche (bien que ce test ne soit plus nécessaire si le P2002 est géré)
      // Laissez ce test pour la couverture.
      prismaServiceMock.users.findUnique.mockResolvedValue(mockUser);

      // Execute & Assert
      // Ici, on attend le ConflictException levé par la logique du service qui gère l'email/username déjà pris (P2002)
      // Pour ce mock, nous allons simuler directement l'erreur P2002
      const error = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] }
      });
      prismaServiceMock.users.create.mockRejectedValue(error);

      await expect(service.create(mockCreateUserDto as any)).rejects.toThrow(ConflictException);
      await expect(service.create(mockCreateUserDto as any)).rejects.toThrow("Le nom d'utilisateur est déjà pris.");
    });

    it('should throw ConflictException if username is already taken (P2002)', async () => {
      // Setup : Simuler l'échec du .create (où l'erreur P2002 est gérée dans le service)
      const error = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['username'] }
      });
      prismaServiceMock.users.create.mockRejectedValue(error);

      // Execute & Assert
      await expect(service.create(mockCreateUserDto as any)).rejects.toThrow(ConflictException);
      await expect(service.create(mockCreateUserDto as any)).rejects.toThrow("Le nom d'utilisateur est déjà pris.");
    });
  });

  // --------------------------------------------------------------------------------------
  // FIND ONE BY EMAIL
  // --------------------------------------------------------------------------------------
  describe('findOneByEmail', () => {
    it('should return a user if found by email (includes hash)', async () => {
      // Setup : findUnique retourne l'utilisateur AVEC le hash
      prismaServiceMock.users.findUnique.mockResolvedValue(mockUser);

      // Execute
      const result = await service.findOneByEmail(mockCreateUserDto.email);

      // Assertions
      expect(prismaServiceMock.users.findUnique).toHaveBeenCalledWith({ where: { email: mockCreateUserDto.email } });
      // Le service findOneByEmail doit retourner l'objet mocké brut (AVEC le hash et le Decimal)
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Setup
      prismaServiceMock.users.findUnique.mockResolvedValue(null);

      // Execute
      const result = await service.findOneByEmail('non-existent@email.com');

      // Assertions
      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------------------
  // FIND ONE
  // --------------------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a user if found by id', async () => {
      // Setup
      prismaServiceMock.users.findUnique.mockResolvedValue(mockUser);

      // Execute
      const result = await service.findOne(mockUser.id);

      // Assertions
      expect(prismaServiceMock.users.findUnique).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(result).toEqual(mockUserWithoutPassword); // Sans hash
    });

    it('should throw NotFoundException if user not found', async () => {
      // Setup
      prismaServiceMock.users.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // --------------------------------------------------------------------------------------
  // FIND ALL
  // --------------------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Setup
      const mockUsersArray = [mockUser, mockUser];
      prismaServiceMock.users.findMany.mockResolvedValue(mockUsersArray);

      // Execute
      const result = await service.findAll();

      // Assertions
      expect(prismaServiceMock.users.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockUserWithoutPassword, mockUserWithoutPassword]);
    });
  });

  // --------------------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------------------
  describe('update', () => {
    const updateDto: UpdateUserDto = { username: 'newname' };
    const updatedUser = { ...mockUser, username: 'newname' };

    it('should update the user and return the result without hash', async () => {
      // Setup
      prismaServiceMock.users.update.mockResolvedValue(updatedUser);

      // Execute
      const result = await service.update(mockUser.id, updateDto);

      // Assertions
      expect(prismaServiceMock.users.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateDto,
      });
      expect(result.username).toBe('newname');
    });

    it('should throw NotFoundException if user to update is not found (P2025)', async () => {
      // Setup
      const error = new PrismaClientKnownRequestError('Record to update not found', {
        code: 'P2025',
        clientVersion: 'test'
      });
      prismaServiceMock.users.update.mockRejectedValue(error);

      // Execute & Assert
      await expect(service.update(mockUser.id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  // --------------------------------------------------------------------------------------
  // REMOVE
  // --------------------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete the user', async () => {
      // Setup: delete ne retourne rien par défaut
      prismaServiceMock.users.delete.mockResolvedValue(mockUser);

      // Execute
      const result = await service.remove(mockUser.id);

      // Assertions
      expect(prismaServiceMock.users.delete).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(result).toEqual({ message: `Utilisateur avec l'ID ${mockUser.id} supprimé avec succès.` });
    });

    it('should throw NotFoundException if user to delete is not found (P2025)', async () => {
      // Setup
      const error = new PrismaClientKnownRequestError('Record to delete not found', {
        code: 'P2025',
        clientVersion: 'test'
      });
      prismaServiceMock.users.delete.mockRejectedValue(error);

      // Execute & Assert
      await expect(service.remove(mockUser.id)).rejects.toThrow(NotFoundException);
    });
  });
});