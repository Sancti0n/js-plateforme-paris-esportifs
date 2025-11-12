import {
    Controller,
    Get,
    Body,
    Patch,
    Param,
    Delete,
    Post,
    UseGuards, // Import pour la sécurité
    Request // Import pour accéder à l'objet requête
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport'; // Import pour utiliser le guard 'jwt'

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    // ----------------------------------------------------------------------------------
    // NOUVELLE ROUTE SÉCURISÉE : Récupérer le profil de l'utilisateur connecté
    // ----------------------------------------------------------------------------------
    @UseGuards(AuthGuard('jwt')) // 🔒 Protège cette route en utilisant la stratégie 'jwt'
    @Get('me')
    getProfile(@Request() req) {
        // Le payload du JWT (défini dans jwt.strategy.ts) est injecté dans req.user
        // Il contient { userId, email }
        return this.userService.findOne(req.user.userId);
    }
    // ----------------------------------------------------------------------------------
    // FIN NOUVELLE ROUTE SÉCURISÉE
    // ----------------------------------------------------------------------------------

    @Get()
    findAll() {
        return this.userService.findAll();
    }

    // ... (Le reste du contrôleur reste inchangé)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.userService.remove(id);
    }
}