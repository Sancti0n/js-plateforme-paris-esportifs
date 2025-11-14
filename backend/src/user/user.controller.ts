// src/user/user.controller.ts

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// Import du Guard JWT (nom de fichier corrigé en 'jwt-auth.guard')
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    // 1. Inscription : Route POST publique
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    // 2. Profil de l'utilisateur connecté (/user/me) : Protégée
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Request() req) {
        // Le Guard attache l'objet utilisateur (avec l'ID) à req.user
        return this.userService.findOne(req.user.userId);
    }

    // 3. Récupération de tous les utilisateurs : Protégée (nécessite un rôle Admin idéalement)
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
        return this.userService.findAll();
    }

    // 4. Récupération par ID : Protégée
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.userService.findOne(id);
    }

    // 5. Mise à jour : Protégée
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(id, updateUserDto);
    }

    // 6. Suppression : Protégée
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.userService.remove(id);
    }
}