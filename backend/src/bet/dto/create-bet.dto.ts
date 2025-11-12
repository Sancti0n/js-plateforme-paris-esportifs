// src/bet/dto/create-bet.dto.ts

import { IsUUID, IsNumber, IsNotEmpty, Min, IsString } from 'class-validator';

export class CreateBetDto {
    @IsUUID()
    @IsNotEmpty()
    // Correction 1 : Changer number en string pour les UUID
    readonly matchId: string;

    @IsUUID()
    @IsNotEmpty()
    // Correction 2 : Changer number en string pour les UUID (Ceci est la ligne qui provoque l'erreur)
    readonly teamId: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @IsNotEmpty()
    readonly amount: number;

    // Assurez-vous que userId est également un UUID (string)
    @IsUUID()
    @IsNotEmpty()
    readonly userId: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1.01)
    @IsNotEmpty()
    readonly odd: number;
}