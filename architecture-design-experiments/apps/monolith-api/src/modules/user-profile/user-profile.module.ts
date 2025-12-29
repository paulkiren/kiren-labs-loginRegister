import { Module } from '@nestjs/common';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './services/user-profile.service';
import { PrismaUserRepository } from '../../infrastructure/adapters/prisma-user.repository';

@Module({
  controllers: [UserProfileController],
  providers: [
    UserProfileService,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
})
export class UserProfileModule {}
