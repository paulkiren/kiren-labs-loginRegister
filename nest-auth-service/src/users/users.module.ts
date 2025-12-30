
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JsonUsersRepository } from './json-users.repository';
import { TypeOrmUsersRepository } from './typeorm-users.repository';
import { USERS_REPOSITORY } from './users.repository';

const shouldUseJson = () => (process.env.USER_STORE || process.env.DB_TYPE || 'typeorm').toLowerCase() === 'json';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    JsonUsersRepository,
    TypeOrmUsersRepository,
    {
      provide: USERS_REPOSITORY,
      useFactory: (jsonRepo: JsonUsersRepository, ormRepo: TypeOrmUsersRepository) =>
        shouldUseJson() ? jsonRepo : ormRepo,
      inject: [JsonUsersRepository, TypeOrmUsersRepository],
    },
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
