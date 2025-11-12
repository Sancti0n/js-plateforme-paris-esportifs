import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateBetDto } from './dto/create-bet.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BetService {
    // Injection du PrismaService
    constructor(private readonly prisma: PrismaService) { }

    // Statuts locaux pour correspondre à la colonne 'status' (String) dans schema.prisma
    private readonly BetStatus = {
        PENDING: 'pending',
        WON: 'won',
        LOST: 'lost',
        // Ajoutez d'autres statuts si nécessaire
    };

    async create(createBetDto: CreateBetDto) {
        const { matchId, teamId, amount, userId, odd } = createBetDto;

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
        if (teamId !== match.team1Id && teamId !== match.team2Id) {
            throw new BadRequestException('L\'équipe pariée n\'est pas une participante de ce match.');
        }

        // 4. Calculer le gain potentiel (odd est déjà dans le DTO)
        const potentialPayout = amount * odd;

        try {
            // --- Transaction Atomique ---
            const result = await this.prisma.$transaction([
                // 1. Déduire le montant du solde de l'utilisateur
                this.prisma.user.update({
                    where: { id: userId, balance: { gte: amount } }, // Vérification de solde insuffisant
                    data: {
                        balance: { decrement: amount },
                    },
                }),

                // 2. Créer le pari
                this.prisma.bet.create({
                    data: {
                        amount: amount,
                        odds: odd,
                        potential_payout: potentialPayout,
                        status: this.BetStatus.PENDING,
                        match: { connect: { id: matchId } },
                        team: { connect: { id: teamId } },
                        user: { connect: { id: userId } },
                    },
                }),
            ]);

            return result[1];

        } catch (e) {
            throw new BadRequestException('Erreur lors de la création du pari (solde insuffisant ou autre problème).');
        }
    }

    async resolveMatchBets(matchId: string, winningTeamId: string) {
        // 1. Mettre à jour le match comme terminé et désigner le vainqueur
        const updatedMatch = await this.prisma.match.update({
            where: { id: matchId, status: 'SCHEDULED' },
            data: {
                status: 'FINISHED',
                // CORRECTION: Utiliser 'winnerId' (si cela correspond à votre schema.prisma)
                winnerId: winningTeamId
            },
        });

        if (!updatedMatch) {
            throw new NotFoundException(`Match ${matchId} non trouvé ou déjà terminé.`);
        }

        // 2. Récupérer tous les paris non résolus pour ce match
        const bets = await this.prisma.bet.findMany({
            where: { matchId: matchId, isResolved: false },
        });

        // 3. Logique de résolution et de mise à jour du solde
        const userUpdatePromises = bets
            .filter(bet => bet.teamId === winningTeamId)
            .map(bet => {
                const payout = Number(bet.potential_payout);

                return this.prisma.user.update({
                    where: { id: bet.userId },
                    data: {
                        balance: {
                            increment: payout,
                        },
                    },
                });
            });

        await Promise.all(userUpdatePromises);

        // 4. Marquer les paris comme résolus
        const { count: wonCount } = await this.prisma.bet.updateMany({
            where: { matchId: matchId, isResolved: false, teamId: winningTeamId },
            data: { isResolved: true, status: this.BetStatus.WON },
        });

        const { count: lostCount } = await this.prisma.bet.updateMany({
            where: {
                matchId: matchId,
                isResolved: false,
                teamId: { not: winningTeamId }
            },
            data: {
                isResolved: true,
                status: this.BetStatus.LOST
            },
        });

        return {
            message: `Match ${matchId} résolu. ${wonCount + lostCount} paris mis à jour et soldes crédités.`,
            resolvedBetsCount: wonCount + lostCount,
        };
    }

    findAll() {
        return `This action returns all bet`; // Place-holder
    }

    // 🟢 AJOUT CRITIQUE POUR LE TEST DU CONTRÔLEUR
    async findAllByUser(userId: string) {
        return this.prisma.bet.findMany({
            where: { userId },
            orderBy: { placed_at: 'desc' },
        });
    }
}