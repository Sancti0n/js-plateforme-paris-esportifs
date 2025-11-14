// src/prisma/prisma.module.ts

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// 🔴 CORRECTION : Ajouter @Global()
// Ceci garantit que PrismaService est disponible pour tous les autres modules (y compris AuthModule)
// dès le début, ce qui devrait éliminer le log d'erreur au démarrage.
@Global()
@Module({
  providers: [PrismaService],
  // L'export est essentiel pour que les autres modules puissent l'utiliser
  exports: [PrismaService],
})
export class PrismaModule { }