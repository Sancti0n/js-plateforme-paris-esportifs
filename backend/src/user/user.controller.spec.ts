import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

// Mock du UserService
const mockUserService = {
  create: jest.fn(),
  findOne: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService, // Utilisation du mock
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    // Nettoyage des mocks avant chaque test
    mockUserService.create.mockClear();
    mockUserService.findOne.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TEST TDD 1 : POST /user (Création d'utilisateur)
  it('should call userService.create and return the created user', async () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@test.com',
      password: 'testPassword',
      balance: 0,
    };
    const expectedResult = { id: 1, ...createUserDto, password: 'hashed', createdAt: new Date() };

    // Simuler le résultat du service
    mockUserService.create.mockResolvedValue(expectedResult);

    // L'appel à 'controller.create()' va échouer (méthode inexistante)
    const result = await controller.create(createUserDto);

    // Assertions
    expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    expect(result).toEqual(expectedResult);
  });

  // TEST TDD 2 : GET /user/:id (Lecture du profil public)
  it('should call userService.findOne and return the public profile', async () => {
    const userId = 5;
    const expectedResult = { id: userId, email: 'public@test.com', balance: 500, createdAt: new Date() };

    // Simuler le résultat du service (sans le mot de passe)
    mockUserService.findOne.mockResolvedValue(expectedResult);

    // CORRECTION : Passer directement le type NUMBER (userId) à la méthode du contrôleur.
    // Le test suppose que le pipe a déjà fait son travail.
    const result = await controller.findOne(userId as any);

    // Assertions
    expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
    expect(result).toEqual(expectedResult);
  });

});