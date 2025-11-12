// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
// CORRECTION : extends PrismaClient est CRITIQUE
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    // Connexion à la base de données au démarrage du module
    await this.$connect();
  }

  async onModuleDestroy() {
    // Déconnexion de la base de données à la destruction du module
    await this.$disconnect();
  }
}