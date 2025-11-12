// src/auth/local.strategy.ts

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        // Initialise la stratégie pour chercher 'email' et 'password' dans le corps de la requête
        super({
            usernameField: 'email',
        });
    }

    // Cette méthode est appelée automatiquement par le LocalAuthGuard
    async validate(email: string, pass: string): Promise<any> {
        const user = await this.authService.validateUser(email, pass);

        // Si l'utilisateur est trouvé et le mot de passe est valide
        if (!user) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        // Le résultat (user sans mot de passe) sera injecté dans req.user
        return user;
    }
}