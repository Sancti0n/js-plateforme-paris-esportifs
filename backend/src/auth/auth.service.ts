// src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

// Interface pour l'utilisateur sans le mot de passe, exportée pour la visibilité
export interface UserWithoutPassword {
    id: number;
    email: string;
    balance: number;
    // Ajoutez d'autres champs non sensibles si nécessaire
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Vérifie l'email et le mot de passe de l'utilisateur.
     * @returns L'objet utilisateur sans le mot de passe, ou null si l'authentification échoue.
     */
    async validateUser(email: string, pass: string): Promise<UserWithoutPassword | null> {
        // 1. Chercher l'utilisateur, en incluant le mot de passe haché
        const user = await this.userService.findByEmail(email);

        if (!user || !user.password) {
            return null;
        }

        // 2. Comparer le mot de passe fourni avec le mot de passe haché en base
        const isPasswordValid = await bcrypt.compare(pass, user.password);

        if (isPasswordValid) {
            // 3. Omettre le mot de passe avant de retourner l'objet utilisateur
            const { password, ...result } = user;
            return result;
        }

        // Si le mot de passe est invalide
        return null;
    }

    /**
     * Génère le jeton JWT pour un utilisateur validé.
     * @param user L'objet utilisateur validé (sans mot de passe).
     * @returns Un objet contenant les informations utilisateur et le jeton d'accès.
     */
    async login(user: UserWithoutPassword) {
        // 1. Créer le payload JWT
        const payload = { email: user.email, sub: user.id };

        // 2. Retourner les données utilisateur et le jeton
        return {
            user: user,
            access_token: this.jwtService.sign(payload),
        };
    }
}