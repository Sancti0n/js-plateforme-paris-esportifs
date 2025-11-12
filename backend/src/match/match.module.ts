// src/match/match.module.ts (Modifiez ce fichier)

import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
// 🔴 CORRECTION : Importez le PrismaModule
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // CORRECTION : Ajout de PrismaModule ici
  controllers: [MatchController],
  providers: [MatchService],
  // Assurez-vous que si d'autres modules ont besoin de MatchService (comme BetModule),
  // vous l'exportiez ici: exports: [MatchService]
})
export class MatchModule { }