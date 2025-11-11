import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Controller('match') // L'URL de base est /match
export class MatchController {
    // 1. Injection du MatchService
    constructor(private readonly matchService: MatchService) { }

    // Implémentation de la méthode create (Phase GREEN)
    @Post() // Mappé sur POST /match
    create(@Body() createMatchDto: CreateMatchDto) {
        // Le contrôleur appelle simplement la logique métier du service
        return this.matchService.create(createMatchDto);
    }

    //  Implémentation de la méthode findAll (Phase GREEN)
    @Get() // Mappé sur GET /match
    findAll() {
        // Le contrôleur appelle la fonction de lecture dans le service
        return this.matchService.findAll();
    }

    @Get(':id') // Mappé sur GET /match/:id
    findOne(@Param('id') id: string) {
        // NestJS convertit automatiquement l'ID de string en number lors de l'appel au service
        return this.matchService.findOne(+id); // Utilisez le '+' pour forcer la conversion string -> number
    }

    @Patch(':id') // Mappé sur PATCH /match/:id
    update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
        // Le contrôleur appelle la fonction de mise à jour
        return this.matchService.update(+id, updateMatchDto);
    }

    @Delete(':id') // Mappé sur DELETE /match/:id
    remove(@Param('id') id: string) {
        // Le contrôleur appelle la fonction de suppression
        return this.matchService.remove(+id);
    }

}