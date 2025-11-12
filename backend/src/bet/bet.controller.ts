// src/bet/bet.controller.ts

import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { BetService } from './bet.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('bets')
export class BetController {
    constructor(private readonly betService: BetService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Req() req, @Body() createBetDto: CreateBetDto) {
        // L'ID utilisateur (userId) est extrait du payload JWT
        const userId = req.user.userId;

        // Appel de la méthode 'create' du service
        return this.betService.create(createBetDto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    // Exemple d'une route pour récupérer les paris de l'utilisateur actuel
    async findAllByUser(@Req() req) {
        const userId = req.user.userId;
        return this.betService.findAllByUser(userId);
    }

    @Get()
    // Route pour récupérer tous les paris (peut nécessiter un rôle d'Admin/Modérateur)
    async findAll() {
        return this.betService.findAll();
    }

    // Vous pouvez ajouter ici la route de résolution (POST /bets/resolve) si elle est exposée
}