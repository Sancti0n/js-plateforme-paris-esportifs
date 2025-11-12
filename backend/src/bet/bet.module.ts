// src/bet/bet.module.ts (Modifiez ce fichier)

import { Module } from '@nestjs/common';
import { BetService } from './bet.service';
import { BetController } from './bet.controller';
// 🔴 Importez le PrismaModule
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // 🔴 CORRECTION : Ajoutez PrismaModule au tableau imports
  imports: [PrismaModule],
  controllers: [BetController],
  providers: [BetService],
  // Si d'autres modules ont besoin de BetService, ajoutez-le aux exports
})
export class BetModule { }