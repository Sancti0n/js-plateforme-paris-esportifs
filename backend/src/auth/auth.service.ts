// src/auth/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { users } from '@prisma/client';
// Importation d'une librairie de hachage (assurez-vous d'avoir installé 'bcryptjs' ou 'bcrypt')
import * as bcrypt from 'bcryptjs';

// Définition d'un type pour les données de l'utilisateur dans le token (sans le hash)
type UserForToken = Omit<users, 'password_hash'>;

// Définition d'un type pour les données utilisateur AVEC le hash
type UserWithHash = users;


@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // 1. Logique de vérification des identifiants (utilisée par LocalStrategy)
    async validateUser(email: string, pass: string): Promise<UserWithHash | null> {
        // 🔴 NOTE CRITIQUE : Nous demandons explicitement le password_hash à Prisma
        const user = await this.prisma.users.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                password_hash: true, // ESSENTIEL pour la validation du mot de passe
                balance: true,
                total_bet: true,
                total_won: true,
                created_at: true,
            }
        }) as UserWithHash; // On caste pour rassurer TypeScript sur la présence de password_hash

        if (!user || !user.password_hash) {
            return null;
        }

        // CORRECTION : Utilisation de bcrypt.compare() pour vérifier le mot de passe
        // const isMatch = (user.password_hash === pass); // C'EST L'ERREUR !

        const isMatch = await bcrypt.compare(pass, user.password_hash);

        if (isMatch) {
            // Retourne l'objet user complet (y compris le hash) pour la stratégie
            return user;
        }

        return null;
    }

    // 2. Logique de connexion et de génération du JWT
    async login(user: any) {
        // Le LocalStrategy a déjà validé l'utilisateur et a retourné un objet SANS le hash.
        // On s'assure que le type correspond à ce qui est attendu par la méthode.
        const userPayload: UserForToken = user as UserForToken;

        const payload = {
            email: userPayload.email,
            sub: userPayload.id // 'sub' est la convention JWT pour l'ID de l'utilisateur
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}