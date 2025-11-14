// src/auth/auth.module.ts

import { Module } from '@nestjs/common'; // <-- Doit être là (pour @Module)
import { AuthService } from './auth.service'; // <-- Souligné en rouge ? Vérifiez le nom du fichier.
import { AuthController } from './auth.controller'; // <-- Souligné en rouge ? Vérifiez le nom du fichier.
import { UserModule } from '../user/user.module'; // <-- NÉCESSAIRE pour injecter UserService
import { JwtModule } from '@nestjs/jwt'; // <-- NÉCESSAIRE pour utiliser JwtService
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- NÉCESSAIRE pour lire JWT_SECRET
import { PassportModule } from '@nestjs/passport'; // <-- NÉCESSAIRE pour les stratégies (Local/JWT)
import { LocalStrategy } from './local.strategy'; // <-- NÉCESSAIRE pour la connexion
import { JwtStrategy } from './jwt.strategy'; // <-- NÉCESSAIRE pour la sécurisation des routes
import { PrismaModule } from '../prisma/prisma.module';


@Module({
    imports: [
        UserModule,
        PassportModule,
        ConfigModule,
        PrismaModule,
        // Configuration du module JWT
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'DEV_SECRET',
                signOptions: {
                    expiresIn: '1h'
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
    ],
    // Exportation pour que les autres modules utilisent la sécurité JWT
    exports: [AuthService, JwtModule],
})
export class AuthModule { }