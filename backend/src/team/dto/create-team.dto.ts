// src/team/dto/create-team.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsUrl, MinLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2) // Exemple de validation
  acronym: string;

  // CORRECTION MAJEURE: Le compilateur (Prisma) exige le champ 'tag'
  // Vous devez l'ajouter car il est requis par votre schéma.
  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsString()
  @IsOptional()
  @IsUrl() // S'assurer que c'est une URL valide
  logoUrl?: string; // Optionnel (match your version)
}