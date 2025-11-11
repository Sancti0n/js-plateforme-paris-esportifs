import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'; // Importez BadRequestException
import { CreateBetDto } from './dto/create-bet.dto';
import { PrismaService } from '../prisma/prisma.service';
//import * as bcrypt from 'bcrypt';

@Injectable()
export class BetService {
    // Injection du PrismaService
    constructor(private readonly prisma: PrismaService) { }

    // 🟢 Implémentation de la méthode create (Phase GREEN)
    async create(createBetDto: CreateBetDto) {
        const { matchId, winningTeamId, amount, userId } = createBetDto;

        // 1. Récupérer le match avec les cotes
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                team1Id: true,
                team2Id: true,
                status: true,
                oddsTeam1: true,
                oddsTeam2: true,
            },
        });

        // 2. Vérifier l'existence et le statut du match (doit être SCHEDULED)
        if (!match || match.status !== 'SCHEDULED') {
            throw new BadRequestException('Match introuvable ou non disponible pour le pari.');
        }

        // 3. Vérifier si l'équipe pariée fait partie du match
        if (winningTeamId !== match.team1Id && winningTeamId !== match.team2Id) {
            throw new BadRequestException('L\'équipe pariée n\'est pas une participante de ce match.');
        }

        // 4. Déterminer la cote (odds)
        const placedOdds = winningTeamId === match.team1Id ? match.oddsTeam1 : match.oddsTeam2;

        // 5. Calculer le gain potentiel (Montant * Cote)
        const potentialPayout = amount * placedOdds;

        // 6. Créer le pari
        return this.prisma.bet.create({
            data: {
                matchId,
                winningTeamId,
                amount,
                userId,
                placedOdds,
                potentialPayout,
                isResolved: false, // Toujours false à la création
            },
        });
    }

    async findAllByUser(userId: number) {
        return this.prisma.bet.findMany({
            where: { userId },
            // Ajout des relations pour enrichir la réponse API
            include: {
                match: true,
                winningTeam: true,
            },
        });
    }

    // 🟢 Implémentation de la méthode resolveMatchBets (Phase GREEN)
    async resolveMatchBets(matchId: number, winningTeamId: number) {
        // 1. Vérifier si le match existe
        const match = await this.prisma.match.findUnique({
            where: { id: matchId }
        });

        if (!match) {
            throw new NotFoundException(`Match avec l'ID ${matchId} introuvable.`);
        }

        // 2. Mettre à jour le statut du Match
        await this.prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'FINISHED',
                winningTeamId: winningTeamId,
            },
        });

        // 3. Récupérer tous les paris non résolus pour ce match
        const bets = await this.prisma.bet.findMany({
            where: { matchId, isResolved: false },
        });

        if (bets.length === 0) {
            // Aucun pari à résoudre
            return { message: `Match ${matchId} marqué comme FINISHED. Aucun pari à résoudre.` };
        }

        // --- Logique de résolution et de mise à jour du solde ---

        // Créer un tableau de promesses pour les mises à jour des utilisateurs
        const userUpdatePromises = bets
            .filter(bet => bet.winningTeamId === winningTeamId) // Filtrer uniquement les paris gagnants
            .map(bet => {
                const payout = bet.potentialPayout;

                // Mettre à jour le solde de l'utilisateur gagnant
                return this.prisma.user.update({
                    where: { id: bet.userId },
                    data: {
                        balance: {
                            increment: payout, // Ajoute le gain potentiel au solde
                        },
                    },
                });
            });

        // Exécuter toutes les mises à jour des utilisateurs en parallèle
        await Promise.all(userUpdatePromises);

        // --- Marquer les paris comme résolus ---

        // 4. Marquer tous les paris du match comme résolus
        const { count } = await this.prisma.bet.updateMany({
            where: { matchId: matchId, isResolved: false },
            data: { isResolved: true },
        });

        return {
            message: `Match ${matchId} résolu. ${count} paris mis à jour et soldes crédités.`,
            resolvedBetsCount: count,
        };
    }

    // Les autres méthodes (findAll, etc.) viendront ici
    findAll() {
        return `This action returns all bet`; // Place-holder
    }
}