// src/team/team.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) { }

  // --------------------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------------------
  async create(createTeamDto: CreateTeamDto) {
    try {
      // 🎯 CORRECTION CRITIQUE: Mappage explicite des champs
      // 1. On ignore 'acronym' (qui n'existe pas dans la DB).
      // 2. On corrige 'logoUrl' (camelCase) en 'logo_url' (snake_case DB).
      const dataToCreate = {
        name: createTeamDto.name,
        tag: createTeamDto.tag,
        logo_url: createTeamDto.logoUrl, // Correction du nom de champ
      };

      return await this.prisma.teams.create({ data: dataToCreate });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException("Le nom ou le tag de l'équipe existe déjà.");
      }
      // Le P2002 est maintenant géré. Toute autre erreur (comme un champ NOT NULL manquant) relancera un 500.
      throw error;
    }
  }

  // --------------------------------------------------------------------------------------
  // FIND ALL
  // --------------------------------------------------------------------------------------
  async findAll() {
    return this.prisma.teams.findMany();
  }

  // --------------------------------------------------------------------------------------
  // FIND ONE
  // --------------------------------------------------------------------------------------
  async findOne(id: string) {
    const team = await this.prisma.teams.findUnique({
      where: { id },
    });
    // Si l'équipe n'est pas trouvée, lance 404
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return team;
  }

  // --------------------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------------------
  async update(id: string, updateTeamDto: UpdateTeamDto) {
    try {
      return await this.prisma.teams.update({
        where: { id },
        data: updateTeamDto,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Team with ID ${id} not found.`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException("Le nom ou le tag de l'équipe existe déjà.");
        }
      }
      throw error;
    }
  }

  // --------------------------------------------------------------------------------------
  // REMOVE
  // --------------------------------------------------------------------------------------
  async remove(id: string) {
    try {
      await this.prisma.teams.delete({ where: { id } });
      return { message: `Team with ID ${id} deleted successfully.` };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Team with ID ${id} not found.`);
      }
      throw error;
    }
  }
}