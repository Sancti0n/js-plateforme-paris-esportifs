// src/team/team.module.ts (Modifiez ce fichier)

import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
// 🔴 Importez le PrismaModule
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // 🔴 CORRECTION : Ajoutez PrismaModule au tableau imports
  imports: [PrismaModule],
  controllers: [TeamController],
  providers: [TeamService],
  // Si d'autres modules ont besoin de TeamService, ajoutez-le aux exports
})
export class TeamModule { }