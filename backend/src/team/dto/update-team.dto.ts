import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamDto } from './create-team.dto';

// PartialType rend tous les champs de CreateTeamDto optionnels
export class UpdateTeamDto extends PartialType(CreateTeamDto) {
  // Aucune propriété n'est ajoutée ici
}