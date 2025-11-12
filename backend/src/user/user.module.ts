// src/user/user.module.ts (Modifiez ce fichier)

import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
// 🔴 Importez le PrismaModule
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // 🔴 CORRECTION : Ajoutez PrismaModule au tableau imports
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  // Il est très probable que d'autres modules (comme AuthModule) aient besoin de UserService,
  // donc il doit être exporté :
  exports: [UserService],
})
export class UserModule { }