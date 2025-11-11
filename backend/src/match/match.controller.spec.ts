import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

// MOCK COMPLET DU MatchService (la logique n'est pas testée ici, seulement l'appel)
const mockMatchService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('MatchController', () => {
  let controller: MatchController;
  let service: MatchService;

  beforeEach(async () => {
    // Réinitialisation des mocks pour tous les tests du contrôleur
    mockMatchService.create.mockClear();
    mockMatchService.findAll.mockClear();
    mockMatchService.findOne.mockClear();
    mockMatchService.update.mockClear();
    mockMatchService.remove.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchController],
      providers: [
        {
          provide: MatchService,
          useValue: mockMatchService, // Utiliser le service mocké
        },
      ],
    }).compile();

    controller = module.get<MatchController>(MatchController);
    service = module.get<MatchService>(MatchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TEST TDD : Teste la route POST /match (création)
  it('should call matchService.create with the correct data and return the result', async () => {
    const createMatchDto: CreateMatchDto = {
      team1Id: 1,
      team2Id: 2,
      startTime: new Date('2026-10-25T18:00:00.000Z')
    };
    const expectedResult = { id: 1, ...createMatchDto, status: 'SCHEDULED' };

    // Simuler le service (la valeur que le service devrait retourner)
    mockMatchService.create.mockResolvedValue(expectedResult);

    // L'appel à 'controller.create()' va échouer car la méthode n'existe pas encore
    const result = await controller.create(createMatchDto);

    // Assertions
    expect(result).toEqual(expectedResult);
    expect(service.create).toHaveBeenCalledWith(createMatchDto);
    expect(service.create).toHaveBeenCalledTimes(1);
  });

  // TEST TDD : Teste la route GET /match (lecture de tous les matchs)
  it('should call matchService.findAll and return the list of matches', async () => {
    const matchesList = [
      { id: 1, team1Id: 1, team2Id: 2, startTime: new Date(), status: 'SCHEDULED' },
      { id: 2, team1Id: 3, team2Id: 4, startTime: new Date(), status: 'LIVE' },
    ];

    // Simuler le service (la valeur que le service devrait retourner)
    mockMatchService.findAll.mockResolvedValue(matchesList);

    // L'appel à 'controller.findAll()' va échouer car la méthode n'existe pas encore
    const result = await controller.findAll();

    // Assertions
    expect(result).toEqual(matchesList);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  // TEST TDD : Teste la route GET /match/:id (lecture d'un seul match)
  it('should call matchService.findOne with the correct ID and return the match', async () => {
    const matchId = 1;
    const expectedMatch = { id: matchId, team1Id: 1, team2Id: 2, startTime: new Date(), status: 'SCHEDULED' };

    // Simuler le service (doit retourner le match trouvé)
    mockMatchService.findOne.mockResolvedValue(expectedMatch);

    // L'appel à 'controller.findOne()' va échouer car la méthode n'existe pas encore
    const result = await controller.findOne(matchId.toString()); // L'ID est passé comme string par NestJS

    // Assertions
    expect(result).toEqual(expectedMatch);
    // NestJS convertit automatiquement le string en number pour le service, mais nous testons l'appel du service avec le ID correct
    expect(service.findOne).toHaveBeenCalledWith(matchId);
    expect(service.findOne).toHaveBeenCalledTimes(1);
  });

  // TEST TDD : Teste la route PATCH /match/:id (mise à jour)
  it('should call matchService.update with the ID and data, and return the updated match', async () => {
    const matchId = 1;
    const updateMatchDto: UpdateMatchDto = { status: 'LIVE' };
    const updatedMatch = { id: matchId, status: 'LIVE', team1Id: 1, team2Id: 2, startTime: new Date() };

    // Simuler le service (doit retourner l'objet mis à jour)
    mockMatchService.update.mockResolvedValue(updatedMatch);

    // L'appel à 'controller.update()' va échouer car la méthode n'existe pas encore
    const result = await controller.update(matchId.toString(), updateMatchDto);

    // Assertions
    expect(result).toEqual(updatedMatch);
    expect(service.update).toHaveBeenCalledWith(matchId, updateMatchDto);
    expect(service.update).toHaveBeenCalledTimes(1);
  });

  it('should call matchService.remove with the correct ID and return the deleted match', async () => {
    const matchId = 1;
    const deletedMatch = { id: matchId, team1Id: 1, team2Id: 2, startTime: new Date(), status: 'SCHEDULED' };

    // Simuler le service (doit retourner l'objet supprimé)
    mockMatchService.remove.mockResolvedValue(deletedMatch);

    // L'appel à 'controller.remove()' va échouer car la méthode n'existe pas encore
    const result = await controller.remove(matchId.toString());

    // Assertions
    expect(result).toEqual(deletedMatch);
    expect(service.remove).toHaveBeenCalledWith(matchId);
    expect(service.remove).toHaveBeenCalledTimes(1);
  });
});