import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';

// MOCK GLOBAL DU SERVICE PRISMA
const prismaServiceMock = {
  match: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('MatchService (TDD - CRUD Complet)', () => {
  let service: MatchService;

  beforeEach(async () => {
    // Réinitialisation des mocks entre chaque test (Toutes les méthodes doivent être effacées)
    prismaServiceMock.match.create.mockClear();
    prismaServiceMock.match.findMany.mockClear();
    prismaServiceMock.match.findUnique.mockClear(); // Doit être là pour findOne
    prismaServiceMock.match.update.mockClear();
    prismaServiceMock.match.delete.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 1. TEST CREATE (Doit passer, ou nous l'avons déjà implémenté)
  it('should successfully create a new match and return it', async () => {
    const matchData: CreateMatchDto = {
      team1Id: 1,
      team2Id: 2,
      startTime: new Date('2026-10-25T18:00:00.000Z')
    };

    const expectedResult = {
      id: 1,
      ...matchData,
      status: 'SCHEDULED',
      createdAt: new Date()
    };

    prismaServiceMock.match.create.mockResolvedValue(expectedResult);

    const result = await service.create(matchData);

    expect(result).toEqual(expectedResult);
    expect(prismaServiceMock.match.create).toHaveBeenCalledWith({ data: matchData });
  });

  // TEST TDD 2 : Teste la lecture de tous les matchs
  it('should return an array of all matches', async () => {
    const matchesList = [
      { id: 1, team1Id: 1, team2Id: 2, startTime: new Date(), status: 'SCHEDULED', createdAt: new Date() },
      { id: 2, team1Id: 3, team2Id: 4, startTime: new Date(), status: 'LIVE', createdAt: new Date() },
    ];

    // Simuler que 'findMany' retourne la liste
    prismaServiceMock.match.findMany.mockResolvedValue(matchesList);

    // L'appel à 'service.findAll()' va échouer car la méthode n'existe pas encore
    const result = await service.findAll();

    // Assertions
    expect(result).toEqual(matchesList);
    expect(prismaServiceMock.match.findMany).toHaveBeenCalled();
  });

  // 🔴 TEST TDD 3 : Teste la lecture d'un match par ID
  it('should return a single match by its ID, including related teams', async () => {
    const matchId = 1;
    const expectedMatch = {
      id: matchId,
      team1Id: 1,
      team2Id: 2,
      startTime: new Date(),
      status: 'SCHEDULED',
      createdAt: new Date(),
      // Les champs 'team1' et 'team2' seront inclus si le service le fait
      team1: { /* ... data ... */ },
      team2: { /* ... data ... */ }
    };

    // Simuler que 'findUnique' retourne l'objet attendu
    prismaServiceMock.match.findUnique.mockResolvedValue(expectedMatch);

    // L'appel à 'service.findOne()' va échouer car la méthode n'existe pas encore
    const result = await service.findOne(matchId);

    // Assertions
    expect(result).toEqual(expectedMatch);
    expect(prismaServiceMock.match.findUnique).toHaveBeenCalledWith({ where: { id: matchId }, include: { team1: true, team2: true } });
  });

  // 🔴 TEST TDD 4 : Teste le retour null si match introuvable
  it('should return null if the match is not found', async () => {
    const matchId = 99;

    // Simuler que 'findUnique' retourne null
    prismaServiceMock.match.findUnique.mockResolvedValue(null);

    // L'appel à 'service.findOne()' va échouer car la méthode n'existe pas encore
    const result = await service.findOne(matchId);

    // Assertions
    expect(result).toBeNull();
    expect(prismaServiceMock.match.findUnique).toHaveBeenCalledWith({ where: { id: matchId }, include: { team1: true, team2: true } });
  });

});