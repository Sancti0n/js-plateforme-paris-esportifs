// src/user/user.controller.ts

import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    UseGuards
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    // VERSION PROTÉGÉE PAR JWT (LA SEULE GARDÉE)
    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        // Note: Le service findOne est sécurisé pour ne PAS renvoyer le mot de passe haché
        return this.userService.findOne(id);
    }
}