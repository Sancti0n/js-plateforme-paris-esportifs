// src/prisma/prisma.module.ts (Modifiez ce fichier)

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  // 🔴 CORRECTION : EXPORTATION de PrismaService
  exports: [PrismaService],
})
export class PrismaModule { }