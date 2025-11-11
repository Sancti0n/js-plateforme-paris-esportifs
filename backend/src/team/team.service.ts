import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto'; // ASSUREZ-VOUS QUE CET IMPORT EST PRÉSENT

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTeamDto) {
    return this.prisma.team.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.team.findMany();
  }

  async findOne(id: number) {
    return this.prisma.team.findUnique({
      where: { id },
    });
  }

  // MÉTHODE UPDATE (PATCH)
  async update(id: number, data: UpdateTeamDto) {
    // 1. Vérifier si l'équipe existe pour éviter une erreur Prisma
    const existingTeam = await this.prisma.team.findUnique({ where: { id } });
    if (!existingTeam) {
      return null;
    }

    // 2. Mise à jour de l'équipe
    return this.prisma.team.update({
      where: { id },
      data,
    });
  }

  // MÉTHODE REMOVE (DELETE)
  async remove(id: number) {
    // 1. Vérifier si l'équipe existe (pour retourner null si non trouvée)
    const existingTeam = await this.prisma.team.findUnique({ where: { id } });
    if (!existingTeam) {
      return null;
    }

    // 2. Supprimer l'équipe
    return this.prisma.team.delete({
      where: { id },
    });
  }
}
