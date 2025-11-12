// src/auth/auth.controller.ts

import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
// L'importation de LocalAuthGuard échouera si nous ne le créons pas, nous utilisons le nom de classe directement
import { AuthGuard } from '@nestjs/passport';
// NOTE: Dans une vraie application, on créerait un fichier 'local-auth.guard.ts' pour étendre AuthGuard('local')

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // 🟢 Implémentation de la route POST /auth/login (Phase GREEN)
    // Utilise le AuthGuard('local') pour déclencher LocalStrategy.validate
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req: any) {
        // Si le guard passe, req.user contient l'utilisateur validé
        // Nous passons req.user au service d'authentification pour générer le JWT.
        return this.authService.login(req.user);
    }
}