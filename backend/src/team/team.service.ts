// src/team/team.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) { }

  async create(createTeamDto: CreateTeamDto) {
    return this.prisma.teams.create({ data: createTeamDto });
  }

  async findAll() {
    return this.prisma.teams.findMany();
  }

  // L'ID est une string (UUID)
  async findOne(id: string) {
    const team = await this.prisma.teams.findUnique({
      where: { id },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return team;
  }

  // L'ID est une string (UUID)
  async update(id: string, updateTeamDto: UpdateTeamDto) {
    const existingTeam = await this.prisma.teams.findUnique({ where: { id } });
    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return this.prisma.teams.update({ where: { id }, data: updateTeamDto as any });
  }

  // L'ID est une string (UUID)
  async remove(id: string) {
    const existingTeam = await this.prisma.teams.findUnique({ where: { id } });
    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return this.prisma.teams.delete({ where: { id } });
  }
}