// src/auth/auth.types.ts (CORRIGÉ)

import { users } from '@prisma/client';

// Utilisé pour la validation où le hash est nécessaire
export type UserWithHash = users;

// Utilisé pour le token (sans le hash)
export type UserForToken = Omit<users, 'password_hash'>;