import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// --- Mocks pour les données ---
// Le résultat attendu après création (contient les champs publics)
const mockUserResult = {
  id: 'user-id-1',
  username: 'testuser',
  email: 'test@example.com',
  balance: 0
};

// Le DTO envoyé au contrôleur (NE CONTIENT PAS 'balance' ni 'id')
const mockCreateDto: CreateUserDto = {
  username: 'newuser',
  email: 'new@example.com',
  password: 'securepassword',
};

const mockUpdateDto: UpdateUserDto = {
  username: 'updatedname',
};

const usersList = [
  mockUserResult,
  { id: 'user-id-2', username: 'user2', email: 'user2@mail.com', balance: 500 }
];


// --- Mock du UserService (Simule les appels à la DB/Prisma) ---
const userServiceMock = {
  create: jest.fn().mockResolvedValue(mockUserResult),
  findAll: jest.fn().mockResolvedValue(usersList),
  findOne: jest.fn().mockResolvedValue(mockUserResult),
  update: jest.fn().mockResolvedValue({ ...mockUserResult, ...mockUpdateDto }),
  remove: jest.fn().mockResolvedValue({ message: 'Supprimé avec succès.' }),
  // findOneByEmail n'a pas besoin d'être mocké pour le contrôleur
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
          useValue: userServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
    jest.clearAllMocks(); // Réinitialiser les mocks entre les tests
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --------------------------------------------------------------------------------------
  // create (POST /user)
  // --------------------------------------------------------------------------------------
  describe('create', () => {
    it('should call userService.create and return the created user (CORRECTED)', async () => {
      // 🟢 mockCreateDto est conforme au type CreateUserDto (pas de champ 'balance')
      const result = await controller.create(mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockUserResult);
    });
  });

  // --------------------------------------------------------------------------------------
  // findAll (GET /user)
  // --------------------------------------------------------------------------------------
  describe('findAll', () => {
    it('should call userService.findAll and return a list of users', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(usersList);
    });
  });

  // --------------------------------------------------------------------------------------
  // findOne (GET /user/:id)
  // --------------------------------------------------------------------------------------
  describe('findOne', () => {
    const userId = mockUserResult.id; // Assurez-vous que l'ID est un string (UUID)

    it('should call userService.findOne with the correct ID and return a user', async () => {
      const result = await controller.findOne(userId);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserResult);
    });
  });

  // --------------------------------------------------------------------------------------
  // update (PATCH /user/:id)
  // --------------------------------------------------------------------------------------
  describe('update', () => {
    const userId = mockUserResult.id;

    it('should call userService.update and return the updated user', async () => {
      const result = await controller.update(userId, mockUpdateDto);

      expect(service.update).toHaveBeenCalledWith(userId, mockUpdateDto);
      expect(result.username).toEqual(mockUpdateDto.username);
    });
  });

  // --------------------------------------------------------------------------------------
  // remove (DELETE /user/:id)
  // --------------------------------------------------------------------------------------
  describe('remove', () => {
    const userId = mockUserResult.id;

    it('should call userService.remove with the correct ID', async () => {
      const result = await controller.remove(userId);

      expect(service.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'Supprimé avec succès.' });
    });
  });
});