// src/auth/jwt.strategy.ts

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Interface pour le payload minimal (ce qui est encodé dans le JWT)
export interface JwtPayload {
    email: string;
    // 🔴 CORRECTION : L'ID (sub) doit être une STRING (UUID)
    sub: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            // 1. Extraire le JWT de l'en-tête "Authorization: Bearer <token>"
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, // Le jeton doit être valide
            // 2. Utiliser la clé secrète configurée dans .env
            secretOrKey: configService.get<string>('JWT_SECRET') || 'DEV_SECRET',
        });
    }

    // Cette méthode est appelée après la validation du jeton par Passport
    async validate(payload: JwtPayload) {
        // Le contenu du payload (email et ID) sera attaché à req.user
        return {
            userId: payload.sub,
            email: payload.email
        };
    }
}