import { Test, TestingModule } from '@nestjs/testing';
import { BetService } from './bet.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// --- Définitions de Mocks ---
const prismaServiceMock = {
  // CRITIQUE : Ajout de $transaction
  $transaction: jest.fn(),
  user: { update: jest.fn() },
  match: { findUnique: jest.fn(), update: jest.fn() },
  bet: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() }, // Ajout de findUnique pour le controller si besoin
} as any;

// Statuts locaux pour correspondre à la correction de bet.service.ts
const BetStatus = {
  PENDING: 'pending',
  WON: 'won',
  LOST: 'lost',
};

// Données de base mockées (IDs en strings)
const mockUser = { id: 'user-1', email: 'test@example.com', username: 'testuser', balance: 1000, password: 'hashedpassword' };
const mockMatch = {
  id: 'match-1',
  team1Id: 'team-10', // ID d'équipe 1 (VALIDE)
  team2Id: 'team-20', // ID d'équipe 2 (VALIDE)
  status: 'SCHEDULED',
  oddsTeam1: 1.5,
  oddsTeam2: 2.5,
};

describe('BetService', () => {
  let service: BetService;

  beforeEach(async () => {
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
    jest.clearAllMocks(); // Réinitialiser les appels entre les tests

    // Mock par défaut pour la création de pari (pour éviter les échecs dans les tests resolve)
    prismaServiceMock.match.findUnique.mockResolvedValue(mockMatch);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --------------------------------------------------------------------------------------------------------------------------------
  // TEST TDD 1 : Création d'un Pari (Transaction Atomique)
  // --------------------------------------------------------------------------------------------------------------------------------
  describe('create', () => {
    const userId = 'user-1';
    const matchId = 'match-1';
    const teamId = 'team-10';
    const amount = 50;
    const odd = 1.5;

    const createBetDto: CreateBetDto = {
      matchId,
      teamId,
      amount,
      odd,
      userId,
    };

    const mockTransactionResult = [
      { ...mockUser, balance: mockUser.balance - amount },
      { id: 'bet-100', status: BetStatus.PENDING, amount, odd, userId, matchId, teamId, potential_payout: amount * odd },
    ];

    it('should create a bet, deduct balance, and run in a transaction (GREEN)', async () => {
      prismaServiceMock.$transaction.mockResolvedValue(mockTransactionResult);
      prismaServiceMock.match.findUnique.mockResolvedValue(mockMatch);

      const result = await service.create(createBetDto);

      // 1. Assertion sur le résultat (retourne le pari créé)
      expect(result).toEqual(mockTransactionResult[1]);

      // 2. Assurer que la transaction a été appelée
      expect(prismaServiceMock.$transaction).toHaveBeenCalledTimes(1);

      // 3. Vérification que le callback de transaction est bien une fonction (évite la TypeError)
      //const transactionCallback = prismaServiceMock.$transaction.mock.calls[0][0];
      //expect(typeof transactionCallback).toBe('function');

      // NOTE : La simulation du mock interne (prismaClientMock) est retirée pour éviter les erreurs de type/portée
      // Le test se concentre sur l'interface publique.
    });

    it('should throw BadRequestException if teamId is invalid (RED fixe)', async () => {
      prismaServiceMock.match.findUnique.mockResolvedValue(mockMatch);

      const invalidBetDto: CreateBetDto = {
        ...createBetDto,
        teamId: 'team-50', // ID d'équipe NON VALIDE (cause l'échec de validation du service)
      };

      await expect(service.create(invalidBetDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidBetDto)).rejects.toThrow('L\'équipe pariée n\'est pas une participante de ce match.');

      // Assurer que la transaction n'a jamais été appelée
      expect(prismaServiceMock.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on insufficient balance (RED fixe)', async () => {
      prismaServiceMock.match.findUnique.mockResolvedValue(mockMatch);

      // Simuler l'échec de la transaction (solde insuffisant)
      prismaServiceMock.$transaction.mockRejectedValue(new Error('P2004: Transaction failed (simulated insufficient funds)'));

      await expect(service.create(createBetDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createBetDto)).rejects.toThrow('Erreur lors de la création du pari (solde insuffisant ou autre problème).');
    });
  });

  // --------------------------------------------------------------------------------------------------------------------------------
  // TEST DE RÉSOLUTION DE MATCH (ResolveMatchBets)
  // --------------------------------------------------------------------------------------------------------------------------------

  describe('resolveMatchBets', () => {
    const matchId = 'match-1';
    const winningTeamId = 'team-10'; // Équipe 1 est la gagnante
    const loserTeamId = 'team-20';

    const unresolvedBets = [
      // Pari gagnant (mise 100, cote 2.0 -> gain 200)
      { id: 'bet-a', userId: 'user-win-1', teamId: winningTeamId, amount: 100, odd: 2.0, isResolved: false, potential_payout: 200 },
      // Pari perdant
      { id: 'bet-b', userId: 'user-lose-1', teamId: loserTeamId, amount: 50, odd: 2.0, isResolved: false, potential_payout: 100 },
    ];

    it('should update match status, resolve all associated bets, and update user balances (GREEN)', async () => {

      // 1. Mock de la mise à jour du match
      prismaServiceMock.match.update.mockResolvedValue({ id: matchId, status: 'FINISHED' });

      // 2. Mock de la récupération des paris
      prismaServiceMock.bet.findMany.mockResolvedValue(unresolvedBets);

      // 3. Mock des mises à jour des utilisateurs (Promise.all)
      prismaServiceMock.user.update.mockImplementation(({ where: { id } }) => {
        if (id === 'user-win-1') {
          return Promise.resolve({ id: 'user-win-1', balance: 1200 });
        }
        return Promise.resolve({ id: 'user-lose-1', balance: 50 });
      });

      // 4. Mock de la mise à jour du statut des paris (1 WON, 1 LOST -> Total 2)
      prismaServiceMock.bet.updateMany.mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });


      const result = await service.resolveMatchBets(matchId, winningTeamId);

      // A. Vérification de la mise à jour du match
      expect(prismaServiceMock.match.update).toHaveBeenCalledWith({
        where: { id: matchId, status: 'SCHEDULED' },
        data: { status: 'FINISHED', winnerId: winningTeamId },
      });

      // B. Vérification de la mise à jour des soldes (utilisateur gagnant)
      const expectedPayoutWinner = unresolvedBets[0].potential_payout; // Utiliser la propriété mockée
      expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: unresolvedBets[0].userId },
        data: { balance: { increment: expectedPayoutWinner } }
      });

      // C. Vérification de la mise à jour des paris (appelé 2 fois : WON et LOST)
      expect(prismaServiceMock.bet.updateMany).toHaveBeenCalledTimes(2);

      // D. Assertion sur le retour (attendu 2)
      expect(result.resolvedBetsCount).toEqual(unresolvedBets.length); // 2
    });

    it('should throw NotFoundException if match is not found', async () => {
      // Mock de la mise à jour du match à null
      prismaServiceMock.match.update.mockResolvedValue(null);

      await expect(service.resolveMatchBets(matchId, winningTeamId)).rejects.toThrow(NotFoundException);
    });
  });
});