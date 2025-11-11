import { Test, TestingModule } from '@nestjs/testing';
import { BetController } from './bet.controller';
import { BetService } from './bet.service';
import { CreateBetDto } from './dto/create-bet.dto';

// Mocks pour le service
const mockBetService = {
  create: jest.fn(),
  findAllByUser: jest.fn(),
  // Note: resolveMatchBets n'est pas exposé via un endpoint utilisateur standard
};

describe('BetController', () => {
  let controller: BetController;
  let service: BetService;

  beforeEach(async () => {
    // Réinitialisation des mocks
    mockBetService.create.mockClear();
    mockBetService.findAllByUser.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BetController],
      providers: [
        {
          provide: BetService,
          useValue: mockBetService,
        },
      ],
    }).compile();

    controller = module.get<BetController>(BetController);
    service = module.get<BetService>(BetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TEST TDD 1 : Teste la route POST /bet (Création)
  it('should call betService.create and return the created bet', async () => {
    const createBetDto: CreateBetDto = {
      matchId: 1,
      winningTeamId: 10,
      amount: 100,
      userId: 1,
    };
    const createdBet = { id: 1, ...createBetDto, isResolved: false };

    // Simuler le service
    mockBetService.create.mockResolvedValue(createdBet);

    // L'appel à 'controller.create()' va échouer car la méthode n'existe pas encore
    const result = await controller.create(createBetDto);

    // Assertions
    expect(result).toEqual(createdBet);
    expect(service.create).toHaveBeenCalledWith(createBetDto);
    expect(service.create).toHaveBeenCalledTimes(1);
  });

  // TEST TDD 2 : Teste la route GET /bet/user/:userId (Lecture par utilisateur)
  it('should call betService.findAllByUser with the correct ID and return a list of bets', async () => {
    const userId = 42;
    const betsList = [
      { id: 1, matchId: 10, userId: userId, amount: 50 },
    ];

    // Simuler le service
    mockBetService.findAllByUser.mockResolvedValue(betsList);

    // L'appel à 'controller.findAllByUser()' va échouer car la méthode n'existe pas encore
    // L'ID est passé comme string par NestJS via @Param
    const result = await controller.findAllByUser(userId.toString());

    // Assertions
    expect(result).toEqual(betsList);
    // NestJS convertit le string en number pour le service (+id)
    expect(service.findAllByUser).toHaveBeenCalledWith(userId);
    expect(service.findAllByUser).toHaveBeenCalledTimes(1);
  });

});