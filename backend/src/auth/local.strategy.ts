// src/auth/local.strategy.ts

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserWithHash, UserForToken } from './auth.types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            // Par défaut, Passport-Local utilise 'username', mais on veut l'email
            usernameField: 'email',
        });
    }

    // La méthode validate est appelée par le LocalAuthGuard
    // Elle doit vérifier les identifiants et retourner l'utilisateur si c'est bon
    async validate(email: string, password: string): Promise<any> {
        // 🔴 ASSUMPTION: Votre AuthService a une méthode validateUser
        const user = await this.authService.validateUser(email, password) as UserWithHash;

        if (!user) {
            // Lance une 401 Unauthorized si les identifiants sont incorrects
            throw new UnauthorizedException('Invalid credentials');
        }

        // On retourne l'utilisateur sans le mot de passe hashé
        // Cet objet sera attaché à req.user par le Guard
        const { password_hash: _, ...result } = user;
        return result;
    }
}