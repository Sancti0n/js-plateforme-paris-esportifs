// src/bet/bet.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { Prisma } from '@prisma/client';
// Importation de la classe Decimal depuis le paquet sous-jacent.
import { Decimal } from 'decimal.js';

@Injectable()
export class BetService {

    constructor(private prisma: PrismaService) { }

    // Méthode pour placer un nouveau pari
    async create(createBetDto: CreateBetDto, userId: string) {
        const { matchId, teamId, amount: amountNum } = createBetDto;

        // UTILISATION : On utilise la classe Decimal installée et importée
        const amount = new Decimal(amountNum);

        // 1. Récupération des données (Match, Cotes et Utilisateur) dans une transaction
        const [match, user] = await this.prisma.$transaction([
            this.prisma.matches.findUnique({
                where: { id: matchId },
                include: { match_odds: { where: { team_id: teamId } } },
            }),
            this.prisma.users.findUnique({
                where: { id: userId },
                select: { id: true, balance: true },
            }),
        ]);

        if (!match || match.status !== 'scheduled') {
            throw new BadRequestException('Match is not available for betting.');
        }

        if (!user || user.balance === null || user.balance.lessThan(amount)) {
            // 🔴 CORRECTION DÉFINITIVE : Un seul "throw"
            throw new BadRequestException('Insufficient balance or user not found.');
        }

        const teamOdds = match.match_odds[0];
        if (!teamOdds) {
            throw new BadRequestException(`Odds not found for team ${teamId} in match ${matchId}.`);
        }
        const oddsValue = teamOdds.odds;
        const potentialPayout = amount.mul(oddsValue);

        // 2. Transaction pour créer le pari et mettre à jour le solde
        const [newBet] = await this.prisma.$transaction([
            this.prisma.bets.create({
                data: {
                    amount,
                    odds: oddsValue,
                    potential_payout: potentialPayout,
                    status: 'pending',
                    matches: { connect: { id: matchId } },
                    users: { connect: { id: userId } },
                    teams: { connect: { id: teamId } },
                },
            }),
            this.prisma.users.update({
                where: { id: userId },
                data: {
                    balance: { decrement: amount },
                    total_bet: { increment: amount }
                },
            }),
        ]);

        return newBet;
    }

    // Méthode findAllByUser (pour le contrôleur)
    async findAllByUser(userId: string) {
        return this.prisma.bets.findMany({
            where: { user_id: userId },
            include: {
                matches: {
                    include: {
                        teams_matches_team1_idToteams: true,
                        teams_matches_team2_idToteams: true,
                    }
                },
                teams: true,
            },
            orderBy: { placed_at: 'desc' },
        });
    }

    // Méthode pour résoudre les paris après un match
    async resolveBets(matchId: string, winningTeamId: string | null) {

        await this.prisma.matches.update({
            where: { id: matchId },
            data: {
                status: 'finished',
                winner_id: winningTeamId,
            }
        })

        const pendingBets = await this.prisma.bets.findMany({
            where: {
                match_id: matchId,
                status: 'pending',
            },
            select: { id: true, user_id: true, amount: true, team_id: true, potential_payout: true },
        });

        if (pendingBets.length === 0) {
            return { message: 'No pending bets to resolve.' };
        }

        const transaction: Prisma.PrismaPromise<any>[] = [];

        const winningBets = pendingBets.filter(bet => bet.team_id === winningTeamId);


        winningBets.forEach(bet => {
            if (bet.user_id) {
                // UTILISATION : On utilise la classe Decimal pour les calculs
                const amount = new Decimal(bet.amount);
                const potentialPayout = new Decimal(bet.potential_payout);

                transaction.push(this.prisma.users.update({
                    where: { id: bet.user_id },
                    data: {
                        balance: { increment: potentialPayout },
                        total_won: { increment: potentialPayout.minus(amount) },
                    },
                }));
            }
        });

        transaction.push(this.prisma.bets.updateMany({
            where: {
                match_id: matchId,
                status: 'pending',
                team_id: winningTeamId,
            },
            data: { status: 'won' },
        }));

        transaction.push(this.prisma.bets.updateMany({
            where: {
                match_id: matchId,
                status: 'pending',
                team_id: { not: winningTeamId },
            },
            data: { status: 'lost' },
        }));

        await this.prisma.$transaction(transaction);

        return { resolved: true, winners: winningBets.length, total: pendingBets.length };
    }

    // Méthode findAll
    async findAll() {
        return this.prisma.bets.findMany({
            include: {
                users: true,
                matches: {
                    include: {
                        teams_matches_team1_idToteams: true,
                        teams_matches_team2_idToteams: true,
                    }
                },
                teams: true
            }
        });
    }
}