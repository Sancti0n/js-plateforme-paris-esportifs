import { Test, TestingModule } from '@nestjs/testing';
import { BetService } from './bet.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { BadRequestException } from '@nestjs/common';

// MOCK GLOBAL DU SERVICE PRISMA
const prismaServiceMock = {
  bet: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(), // AJOUT pour resolveMatchBets
  },
  match: {
    findUnique: jest.fn(),
    update: jest.fn(), // AJOUT pour resolveMatchBets
  },
  user: { // AJOUT pour resolveMatchBets
    update: jest.fn(),
  },
};

// Structure du SELECT attendue par Prisma (utilisée dans create)
const expectedMatchSelect = {
  id: true,
  team1Id: true,
  team2Id: true,
  status: true,
  oddsTeam1: true,
  oddsTeam2: true,
};


describe('BetService (TDD - Création de Pari)', () => {
  let service: BetService;

  beforeEach(async () => {
    // Réinitialisation de TOUS les mocks entre chaque test
    prismaServiceMock.bet.create.mockClear();
    prismaServiceMock.bet.findMany.mockClear();
    prismaServiceMock.bet.updateMany.mockClear(); // CLEAR pour resolveMatchBets
    prismaServiceMock.match.findUnique.mockClear();
    prismaServiceMock.match.update.mockClear(); // CLEAR pour resolveMatchBets
    prismaServiceMock.user.update.mockClear(); // CLEAR pour resolveMatchBets


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<BetService>(BetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 1. TEST TDD : Teste la création d'un pari réussi
  it('should successfully create a new bet if match is valid', async () => {
    const betData: CreateBetDto = {
      matchId: 1,
      winningTeamId: 10,
      amount: 100,
      userId: 1,
    };

    const mockMatch = {
      id: 1,
      team1Id: 10,
      team2Id: 20,
      status: 'SCHEDULED',
      oddsTeam1: 1.5,
      oddsTeam2: 2.5,
    };

    const expectedBetResult = {
      id: 5,
      ...betData,
      isResolved: false,
      placedOdds: 1.5,
      potentialPayout: 100 * 1.5,
    };

    // Simuler l'existence et la création
    prismaServiceMock.match.findUnique.mockResolvedValue(mockMatch);
    prismaServiceMock.bet.create.mockResolvedValue(expectedBetResult);

    const result = await service.create(betData);

    // Assertions
    expect(result).toEqual(expectedBetResult);

    // CORRECTION : S'assurer que le bloc 'select' est inclus dans l'assertion
    expect(prismaServiceMock.match.findUnique).toHaveBeenCalledWith({
      where: { id: betData.matchId },
      select: expectedMatchSelect,
    });

    expect(prismaServiceMock.bet.create).toHaveBeenCalled();
  });

  // 2. TEST TDD : Teste l'échec de la création si le match est introuvable
  it('should throw an error if the match is not found', async () => {
    const betData: CreateBetDto = {
      matchId: 99,
      winningTeamId: 10,
      amount: 100,
      userId: 1,
    };

    prismaServiceMock.match.findUnique.mockResolvedValue(null);

    await expect(service.create(betData)).rejects.toThrow(BadRequestException);
    await expect(service.create(betData)).rejects.toThrow('Match introuvable ou non disponible pour le pari.');

    expect(prismaServiceMock.bet.create).not.toHaveBeenCalled();
    expect(prismaServiceMock.match.findUnique).toHaveBeenCalledWith({
      where: { id: betData.matchId },
      select: expectedMatchSelect,
    });
  });

  // 3. TEST TDD : Teste l'échec si l'équipe pariée n'est pas dans le match
  it('should throw an error if the winning team ID does not belong to the match', async () => {
    const betData: CreateBetDto = {
      matchId: 1,
      winningTeamId: 50,
      amount: 100,
      userId: 1,
    };

    const mockMatch = {
      id: 1,
      team1Id: 10,
      team2Id: 20,
      status: 'SCHEDULED',
      oddsTeam1: 1.5,
      oddsTeam2: 2.5,
    };

    prismaServiceMock.match.findUnique.mockResolvedValue(mockMatch);

    await expect(service.create(betData)).rejects.toThrow(BadRequestException);
    await expect(service.create(betData)).rejects.toThrow('L\'équipe pariée n\'est pas une participante de ce match.');

    expect(prismaServiceMock.bet.create).not.toHaveBeenCalled();
    expect(prismaServiceMock.match.findUnique).toHaveBeenCalledWith({
      where: { id: betData.matchId },
      select: expectedMatchSelect,
    });
  });

  // 4. TEST TDD : Teste la lecture de tous les paris d'un utilisateur
  it('should call prisma.bet.findMany with the correct userId and return the list of bets', async () => {
    const userId = 42;
    const betsList = [
      { id: 1, matchId: 10, userId: userId, amount: 50, isResolved: false },
      { id: 2, matchId: 11, userId: userId, amount: 150, isResolved: true },
    ];

    // Utiliser le mock déjà déclaré
    prismaServiceMock.bet.findMany.mockResolvedValue(betsList);

    const result = await service.findAllByUser(userId);

    // Assertions
    expect(result).toEqual(betsList);
    expect(prismaServiceMock.bet.findMany).toHaveBeenCalledWith({
      where: { userId },
      include: {
        match: true,
        winningTeam: true,
      },
    });
    expect(prismaServiceMock.bet.findMany).toHaveBeenCalledTimes(1);
  });

  // 5. TEST TDD : Teste la logique de résolution des paris après un match (Phase RED)
  it('should update match status, resolve all associated bets, and update user balances (simplified)', async () => {
    const matchId = 10;
    const winningTeamId = 5;
    const losingTeamId = 6;

    const unresolvedBets = [
      { id: 1, matchId, userId: 1, amount: 100, winningTeamId: winningTeamId, placedOdds: 2.0, potentialPayout: 200, isResolved: false }, // GAGNANT
      { id: 2, matchId, userId: 2, amount: 50, winningTeamId: losingTeamId, placedOdds: 1.5, potentialPayout: 75, isResolved: false },  // PERDANT
    ];

    const existingMatch = { id: matchId, winningTeamId: null, status: 'SCHEDULED' };

    // --- Mocks pour ce test ---
    prismaServiceMock.match.findUnique.mockResolvedValue(existingMatch);
    prismaServiceMock.bet.findMany.mockResolvedValue(unresolvedBets);
    prismaServiceMock.match.update.mockResolvedValue({ id: matchId, winningTeamId, status: 'FINISHED' });
    prismaServiceMock.bet.updateMany.mockResolvedValue({ count: 2 });
    prismaServiceMock.user.update.mockResolvedValue({});

    // L'appel à 'service.resolveMatchBets()' va échouer car la méthode n'existe pas encore
    await service.resolveMatchBets(matchId, winningTeamId);

    // --- ASSERTIONS ---

    // A. Le match est mis à jour (statut et gagnant)
    expect(prismaServiceMock.match.update).toHaveBeenCalledWith({
      where: { id: matchId },
      data: {
        status: 'FINISHED',
        winningTeamId: winningTeamId
      },
    });

    // B. Les paris non résolus sont récupérés
    expect(prismaServiceMock.bet.findMany).toHaveBeenCalledWith({
      where: { matchId, isResolved: false }
    });

    // C. Les mises à jour du solde de l'utilisateur sont appelées pour le gagnant
    const expectedPayoutWinner = unresolvedBets[0].potentialPayout;

    expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
      where: { id: unresolvedBets[0].userId },
      data: { balance: { increment: expectedPayoutWinner } }
    });
    // Le perdant (userId 2) ne doit PAS être crédité
    expect(prismaServiceMock.user.update).not.toHaveBeenCalledWith({
      where: { id: unresolvedBets[1].userId },
      data: { balance: expect.anything() }
    });

    // D. Tous les paris sont marqués comme résolus
    expect(prismaServiceMock.bet.updateMany).toHaveBeenCalledWith({
      where: { matchId: matchId, isResolved: false },
      data: { isResolved: true },
    });
  });
});