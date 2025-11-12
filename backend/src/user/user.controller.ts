import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    // Implémentation de la route POST /user (Inscription)
    // L'utilisateur est créé avec un mot de passe haché et un solde initial de 0.
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    // Implémentation de la route GET /user/:id (Profil public/Solde)
    // Utilisation de ParseIntPipe pour garantir que l'ID est un nombre avant de le passer au service.
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        // Note: Le service findOne est sécurisé pour ne PAS renvoyer le mot de passe haché
        return this.userService.findOne(id);
    }
}