import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    UseGuards // Pour la protection des routes
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Nécessaire pour AuthGuard('jwt')
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Note: Dans une application réelle, seules les routes GET (lecture) ou DELETE
// de votre propre ID seraient protégées. Pour l'instant, on protège les lectures spécifiques.

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    // Note: La création d'un utilisateur (inscription) ne devrait pas être protégée par JWT
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Get()
    // Généralement, la liste des utilisateurs est protégée
    @UseGuards(AuthGuard('jwt'))
    findAll() {
        return this.userService.findAll();
    }

    // VERSION PROTÉGÉE PAR JWT
    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    // Utilisation de ParseUUIDPipe pour valider le format de l'ID string
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    // Généralement, seul l'utilisateur peut modifier ses propres données (protection dans le Guard)
    @UseGuards(AuthGuard('jwt'))
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    // Généralement, la suppression est une action réservée à l'administrateur ou à l'utilisateur lui-même
    @UseGuards(AuthGuard('jwt'))
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.remove(id);
    }
}