// src/bet/bet.controller.ts

import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BetService } from './bet.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bets')
export class BetController {
    constructor(private readonly betService: BetService) { }

    // APPLICATION DU GUARD
    @UseGuards(JwtAuthGuard)
    @Post()
    // L'objet @Request nous permet d'accéder aux données utilisateur attachées par le Guard
    create(@Body() createBetDto: CreateBetDto, @Request() req) {
        // req.user contient { userId: 'uuid', email: '...', ... }
        const userId = req.user.userId;
        return this.betService.create(createBetDto, userId);
    }

    // APPLICATION DU GUARD
    @UseGuards(JwtAuthGuard)
    @Get('me')
    findAllByUser(@Request() req) {
        const userId = req.user.userId;
        return this.betService.findAllByUser(userId);
    }

    @Get()
    // Route pour récupérer tous les paris (peut nécessiter un rôle d'Admin/Modérateur)
    async findAll() {
        return this.betService.findAll();
    }

}