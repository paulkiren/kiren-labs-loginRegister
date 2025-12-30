import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { IdentityModule } from './modules/identity/identity.module';
import { UserProfileModule } from './modules/user-profile/user-profile.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    IdentityModule,
    UserProfileModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
