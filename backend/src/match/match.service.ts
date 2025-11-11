import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { PrismaService } from '../prisma/prisma.service'; // Nécessite l'import de Prisma

@Injectable()
export class MatchService {
    // Le constructeur doit injecter Prisma
    constructor(private prisma: PrismaService) { }

    // La méthode 'create' qui a fait passer le test
    async create(createMatchDto: CreateMatchDto) {
        // Enregistre un nouveau match. Prisma gérera le statut par défaut si non spécifié
        return this.prisma.match.create({
            data: createMatchDto,
        });
    }

    // AJOUT DE LA MÉTHODE findAll POUR PASSER LE TEST (Phase GREEN)
    async findAll() {
        return this.prisma.match.findMany({
            // Nous incluons les équipes associées pour rendre les données utiles (Relation 1-N)
            include: {
                team1: true,
                team2: true,
            },
        });
    }

    async findOne(id: number) {
        // Recherche unique avec l'ID, incluant les équipes comme demandé par le test
        return this.prisma.match.findUnique({
            where: { id },
            include: {
                team1: true,
                team2: true,
            },
        });
    }

    async update(id: number, data: UpdateMatchDto) {
        // 1. Vérifier si le match existe
        const existingMatch = await this.prisma.match.findUnique({ where: { id } });
        if (!existingMatch) {
            return null;
        }

        // 2. Mise à jour du match
        return this.prisma.match.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        // 1. Vérifier si le match existe
        const existingMatch = await this.prisma.match.findUnique({ where: { id } });
        if (!existingMatch) {
            return null;
        }

        // 2. Supprimer le match
        return this.prisma.match.delete({
            where: { id },
        });
    }
}