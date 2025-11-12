import { IsString, IsEmail, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsNumber()
    balance: number = 0; // Solde initial par défaut à zéro
}