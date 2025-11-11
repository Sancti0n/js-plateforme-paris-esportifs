// src/prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Constructeur par défaut
  constructor() {
    super({
      // Configuration optionnelle pour le débogage si nécessaire
      // log: ['query', 'info', 'warn', 'error'],
    });
  }

  // Se connecte à la DB au démarrage du module NestJS
  async onModuleInit() {
    await this.$connect();
  }

  // Ferme la connexion à la DB à l'arrêt du module NestJS
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
