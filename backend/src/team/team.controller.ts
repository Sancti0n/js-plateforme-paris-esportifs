// src/team/team.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    @Post()
    create(@Body() createTeamDto: CreateTeamDto) {
        return this.teamService.create(createTeamDto);
    }

    @Get()
    findAll() {
        return this.teamService.findAll();
    }

    @Get(':id')
    // L'ID est une string (UUID)
    findOne(@Param('id') id: string) {
        return this.teamService.findOne(id);
    }

    @Patch(':id')
    // L'ID est une string (UUID)
    update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
        return this.teamService.update(id, updateTeamDto);
    }

    @Delete(':id')
    // L'ID est une string (UUID)
    remove(@Param('id') id: string) {
        return this.teamService.remove(id);
    }
}