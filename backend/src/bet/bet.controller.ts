import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BetService } from './bet.service';
import { CreateBetDto } from './dto/create-bet.dto'; // <-- Importez le DTO

@Controller('bet')
export class BetController {
    constructor(private readonly betService: BetService) { }

    // Implémentation de la méthode create (Phase GREEN)
    @Post() // Mappé sur POST /bet
    create(@Body() createBetDto: CreateBetDto) {
        // Le contrôleur appelle la fonction de création dans le service
        return this.betService.create(createBetDto);
    }

    // Implémentation de la méthode findAllByUser (Phase GREEN)
    @Get('user/:userId') // Mappé sur GET /bet/user/:userId
    findAllByUser(@Param('userId') userId: string) {
        // Le contrôleur appelle la fonction de lecture dans le service
        return this.betService.findAllByUser(+userId); // Utilisation de +userId pour la conversion en nombre
    }

    // Les autres méthodes findAll, etc. viendront ici
}