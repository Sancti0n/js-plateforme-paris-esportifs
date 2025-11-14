// src/auth/auth.controller.ts

import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
// Import du Guard de stratégie locale pour la connexion (vérifie email/password)
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // Route POST /auth/login
    // Le @UseGuards(LocalAuthGuard) exécute la LocalStrategy pour valider les identifiants.
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
        // Si l'authentification réussit, req.user est disponible.
        // authService.login génère le token JWT en utilisant les données de req.user.
        return this.authService.login(req.user);
    }
}