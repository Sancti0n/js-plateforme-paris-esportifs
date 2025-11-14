import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import '@types/jest';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto'; // Ajout

// MOCK GLOBAL DU SERVICE PRISMA
const prismaServiceMock = {
  team: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(), // AJOUT pour le test 'remove'
  },
};

describe('TeamService (TDD - CRUD Complet)', () => {
  let service: TeamService;

  // AJOUT DU BLOC beforeEach MANQUANT
  beforeEach(async () => {
    // RÉINITIALISATION DES MOCKS entre chaque test pour garantir l'isolation
    prismaServiceMock.team.create.mockClear();
    prismaServiceMock.team.findMany.mockClear();
    prismaServiceMock.team.findUnique.mockClear();
    prismaServiceMock.team.update.mockClear();
    prismaServiceMock.team.delete.mockClear(); // Réinitialisation de 'delete'

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =============================================================
  // 1. TESTS CREATE (Existant)
  // =============================================================
  it('should successfully create a new team and return it', async () => {
    const teamData: CreateTeamDto = {
      name: 'Team Vitality',
      acronym: 'VIT',
      logoUrl: 'http://logo.com/vit.png',
      tag: 'teamTag',
    };
    // CORRECTION: ID converti en string
    const expectedResult = { id: '1', ...teamData, createdAt: new Date() };

    prismaServiceMock.team.create.mockResolvedValue(expectedResult);

    const result = await service.create(teamData);

    expect(result).toEqual(expectedResult);
    expect(prismaServiceMock.team.create).toHaveBeenCalledWith({ data: teamData });
  });

  // =============================================================
  // 2. TESTS READ - findAll (Existant)
  // =============================================================
  it('should return an array of all teams', async () => {
    const teamsList = [
      // CORRECTION: IDs convertis en string
      { id: '1', name: 'Team Vitality', acronym: 'VIT', logoUrl: 'url1', createdAt: new Date() },
      { id: '2', name: 'G2 Esports', acronym: 'G2', logoUrl: 'url2', createdAt: new Date() },
    ];

    prismaServiceMock.team.findMany.mockResolvedValue(teamsList);

    const result = await service.findAll();

    expect(result).toEqual(teamsList);
    expect(prismaServiceMock.team.findMany).toHaveBeenCalled();
  });

  // =============================================================
  // 3. TESTS READ - findOne (Existants)
  // =============================================================
  it('should return a single team by its ID', async () => {
    // CORRECTION: teamId est une string
    const teamId = '1';
    const expectedTeam = {
      id: teamId,
      name: 'Team Vitality',
      acronym: 'VIT',
      logoUrl: 'url1',
      createdAt: new Date(),
    };

    prismaServiceMock.team.findUnique.mockResolvedValue(expectedTeam);

    const result = await service.findOne(teamId);

    expect(result).toEqual(expectedTeam);
    expect(prismaServiceMock.team.findUnique).toHaveBeenCalledWith({ where: { id: teamId } });
  });

  it('should return null if the team is not found', async () => {
    // CORRECTION: teamId est une string
    const teamId = '99';

    prismaServiceMock.team.findUnique.mockResolvedValue(null);

    const result = await service.findOne(teamId);

    expect(result).toBeNull();
    expect(prismaServiceMock.team.findUnique).toHaveBeenCalledWith({ where: { id: teamId } });
  });

  // =============================================================
  // 4. TESTS UPDATE (Existants)
  // =============================================================
  it('should successfully update a team and return the updated object', async () => {
    // CORRECTION: teamId est une string
    const teamId = '1';
    const updateData: UpdateTeamDto = { name: 'Team Vitality 2.0' };
    const originalTeam = {
      id: teamId,
      name: 'Team Vitality',
      acronym: 'VIT',
      logoUrl: 'url1',
      createdAt: new Date(),
    };
    const updatedTeam = { ...originalTeam, ...updateData };

    prismaServiceMock.team.findUnique.mockResolvedValue(originalTeam);
    prismaServiceMock.team.update.mockResolvedValue(updatedTeam);

    const result = await service.update(teamId, updateData);

    expect(result).toEqual(updatedTeam);
    expect(prismaServiceMock.team.update).toHaveBeenCalledWith({
      where: { id: teamId },
      data: updateData,
    });
  });

  it('should return null when attempting to update a non-existent team', async () => {
    // CORRECTION: teamId est une string
    const teamId = '99';
    const updateData: UpdateTeamDto = { name: 'Team Inexistante' };

    prismaServiceMock.team.findUnique.mockResolvedValue(null);

    const result = await service.update(teamId, updateData);

    expect(result).toBeNull();
    expect(prismaServiceMock.team.update).not.toHaveBeenCalled();
  });

  // =============================================================
  // 5. TESTS DELETE (Corrigés)
  // =============================================================
  it('should successfully remove a team and return the deleted object', async () => {
    // CORRECTION: teamId est une string
    const teamId = '1';
    const deletedTeam = {
      id: teamId,
      name: 'To be deleted',
      acronym: 'DEL',
      logoUrl: 'url3',
      createdAt: new Date(),
    };

    // Simuler que l'équipe est trouvée (findUnique) avant la suppression
    prismaServiceMock.team.findUnique.mockResolvedValue(deletedTeam);

    // Simuler que la suppression réussit et retourne l'objet supprimé
    prismaServiceMock.team.delete.mockResolvedValue(deletedTeam);

    const result = await service.remove(teamId);

    expect(result).toEqual(deletedTeam);
    expect(prismaServiceMock.team.delete).toHaveBeenCalledWith({
      where: { id: teamId },
    });
  });

  it('should return null when attempting to remove a non-existent team', async () => {
    // CORRECTION: teamId est une string
    const teamId = '99';

    // Simuler que l'équipe est INTROUVABLE (findUnique retourne null)
    prismaServiceMock.team.findUnique.mockResolvedValue(null);

    const result = await service.remove(teamId);

    expect(result).toBeNull();
    // Le mock ne doit PAS être appelé si l'équipe n'existe pas
    expect(prismaServiceMock.team.delete).not.toHaveBeenCalled();
  });
});