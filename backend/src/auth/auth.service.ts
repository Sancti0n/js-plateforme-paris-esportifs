import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Définition de l'interface pour les données utilisateur non sensibles
// 🟢 CORRECTION: L'ID est défini comme 'string' pour correspondre au UUID de Prisma
export interface UserWithoutPassword {
    id: string;
    email: string;
    username: string; // Ajouté pour la cohérence
    balance: number;
}

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) { }

    // Méthode pour valider les identifiants de l'utilisateur
    async validateUser(email: string, pass: string): Promise<UserWithoutPassword | null> {
        // 1. Chercher l'utilisateur par email (cette méthode retourne le hash)
        const user = await this.userService.findOneByEmail(email);

        if (user) {
            // 2. Comparer le mot de passe en clair avec le hash
            const isMatch = await bcrypt.compare(pass, user.password_hash);

            if (isMatch) {
                // 3. Destructurer pour omettre le mot de passe haché
                // Note: user.password_hash est la seule propriété sensible
                const { password_hash, ...result } = user;

                // Assurez-vous que les champs requis par UserWithoutPassword sont présents
                return {
                    id: result.id,
                    email: result.email,
                    username: result.username,
                    balance: result.balance.toNumber(), // S'assurer que le Decimal de Prisma est traité (si nécessaire)
                } as UserWithoutPassword;
            }
        }
        return null;
    }

    // Méthode pour générer le token JWT
    async login(user: UserWithoutPassword) {
        // Payload du token: 'sub' (subject) est une convention JWT pour l'ID utilisateur
        const payload = { email: user.email, sub: user.id };

        return {
            user: user,
            access_token: this.jwtService.sign(payload),
        };
    }
}