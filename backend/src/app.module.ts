import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TeamModule } from './team/team.module';
import { PrismaModule } from './prisma/prisma.module';
import { MatchModule } from './match/match.module';
import { BetModule } from './bet/bet.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [TeamModule, PrismaModule, MatchModule, BetModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
