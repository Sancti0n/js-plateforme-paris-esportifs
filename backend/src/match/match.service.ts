// src/match/match.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchService {
    constructor(private prisma: PrismaService) { }

    async create(createMatchDto: CreateMatchDto) {
        return this.prisma.matches.create({ data: createMatchDto as any });
    }

    async findAll() {
        return this.prisma.matches.findMany({
            // 🔴 CORRECTION DÉFINITIVE DES NOMS DE RELATIONS
            include: {
                teams_matches_team1_idToteams: true,
                teams_matches_team2_idToteams: true,
                bets: true
            },
        });
    }

    async findOne(id: string) {
        const match = await this.prisma.matches.findUnique({
            where: { id },
            // 🔴 CORRECTION DÉFINITIVE DES NOMS DE RELATIONS
            include: {
                teams_matches_team1_idToteams: true,
                teams_matches_team2_idToteams: true,
                bets: true
            },
        });
        if (!match) {
            throw new NotFoundException(`Match with ID ${id} not found`);
        }
        return match;
    }

    async update(id: string, updateMatchDto: UpdateMatchDto) {
        const existingMatch = await this.prisma.matches.findUnique({ where: { id } });
        if (!existingMatch) {
            throw new NotFoundException(`Match with ID ${id} not found`);
        }
        return this.prisma.matches.update({ where: { id }, data: updateMatchDto as any });
    }

    async remove(id: string) {
        const existingMatch = await this.prisma.matches.findUnique({ where: { id } });
        if (!existingMatch) {
            throw new NotFoundException(`Match with ID ${id} not found`);
        }
        return this.prisma.matches.delete({ where: { id } });
    }
}