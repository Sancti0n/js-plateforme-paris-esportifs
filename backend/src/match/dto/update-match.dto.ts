// src/match/dto/update-match.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateMatchDto } from './create-match.dto';

// PartialType permet de rendre tous les champs de CreateMatchDto optionnels (pour une mise à jour)
export class UpdateMatchDto extends PartialType(CreateMatchDto) {
    // Champs spécifiques à la mise à jour (ex: score final ou statut)
    scoreTeam1?: number;
    scoreTeam2?: number;
    status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELED'; // Exemple de statut
}