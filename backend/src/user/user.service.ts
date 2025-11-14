import {
    ConflictException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Le type pour s'assurer que l'objet retourné n'a pas le hash ni les timestamps
export type UserWithoutPassword = { // Exporté pour les autres modules (comme AuthService)
    id: string;
    username: string;
    email: string;
    balance: number;
};

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    // Conversion de l'utilisateur Prisma en objet sans mot de passe haché ni métadonnées
    private mapUserWithoutPassword(user: any): UserWithoutPassword {
        // 🟢 CORRECTION : Omettre explicitement password_hash ET les timestamps de Prisma
        const { password_hash, created_at, updated_at, ...result } = user;

        return {
            ...result,
            // S'assurer que 'balance' est un number pour les tests/contrôleurs
            balance: result.balance ? result.balance.toNumber() : 0,
        } as UserWithoutPassword;
    }

    // --------------------------------------------------------------------------------------
    // CREATE
    // --------------------------------------------------------------------------------------
    async create(createUserDto: CreateUserDto) {
        // 1. Hashage du mot de passe
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        try {
            // 2. Création de l'utilisateur dans la base de données
            const user = await this.prisma.users.create({
                data: {
                    username: createUserDto.username,
                    email: createUserDto.email,
                    password_hash: hashedPassword,
                },
            });

            // 3. Retourner l'objet utilisateur sans le hash ni les timestamps
            return this.mapUserWithoutPassword(user);
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException("Le nom d'utilisateur est déjà pris.");
            }
            throw error;
        }
    }

    // --------------------------------------------------------------------------------------
    // FIND ALL
    // --------------------------------------------------------------------------------------
    async findAll() {
        const users = await this.prisma.users.findMany();
        // Retourner la liste sans les mots de passe ni les timestamps
        return users.map(user => this.mapUserWithoutPassword(user));
    }

    // --------------------------------------------------------------------------------------
    // FIND ONE / FIND ONE BY EMAIL
    // --------------------------------------------------------------------------------------
    async findOne(id: string) {
        const user = await this.prisma.users.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé.`);
        }
        // Retourner sans le mot de passe haché ni les timestamps
        return this.mapUserWithoutPassword(user);
    }

    // Utilisé par AuthService.validateUser, doit retourner l'utilisateur AVEC le hash
    async findOneByEmail(email: string) {
        return this.prisma.users.findUnique({ where: { email } });
    }

    // --------------------------------------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------------------------------------
    async update(id: string, updateUserDto: UpdateUserDto) {
        try {
            const user = await this.prisma.users.update({
                where: { id },
                data: updateUserDto,
            });

            return this.mapUserWithoutPassword(user);
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé.`);
            }
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException("Le nom d'utilisateur ou l'email est déjà pris.");
            }
            throw error;
        }
    }

    // --------------------------------------------------------------------------------------
    // REMOVE
    // --------------------------------------------------------------------------------------
    async remove(id: string) {
        try {
            await this.prisma.users.delete({ where: { id } });
            return { message: `Utilisateur avec l'ID ${id} supprimé avec succès.` };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé.`);
            }
            throw error;
        }
    }
}