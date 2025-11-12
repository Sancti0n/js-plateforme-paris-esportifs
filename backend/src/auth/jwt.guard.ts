// src/auth/jwt.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// 'jwt' correspond au nom de la stratégie que vous avez définie dans jwt.strategy.ts
export class JwtAuthGuard extends AuthGuard('jwt') { }