import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
    // Injecter PrismaService
    constructor(private readonly prisma: PrismaService) { }

    // Implémentation de la méthode create (Phase GREEN)
    async create(createUserDto: CreateUserDto) {
        // 1. Crypter le mot de passe
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // 2. Créer l'utilisateur dans la base de données
        const user = await this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword, // Utiliser le mot de passe crypté
                balance: createUserDto.balance ?? 0, // Assurer un solde par défaut si non fourni
            },
            // Ne pas renvoyer le mot de passe haché dans le résultat final par sécurité
            select: {
                id: true,
                email: true,
                balance: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    // Implémentation de la méthode findByEmail (Phase GREEN)
    async findByEmail(email: string) {
        // Contrairement à 'create', nous devons explicitement inclure le mot de passe
        // car l'authentification en a besoin. Par défaut, Prisma ne renvoie pas les champs
        // marqués @default(false) dans le modèle (comme le password) sans 'select'.
        return this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true, // <-- IMPORTANT : on inclut le mot de passe HACHÉ
                balance: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                balance: true,
                createdAt: true,
                updatedAt: true,
                // Le mot de passe est explicitement omis pour la sécurité (sélection par défaut de Prisma)
                // ou en utilisant 'password: false' si le modèle est configuré pour l'inclure par défaut.
                // Ici, nous nous assurons que seuls les champs publics sont sélectionnés.
            },
        });
    }
}