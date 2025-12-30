
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';

function parseDb() {
  const type = (process.env.DB_TYPE || 'sqlite').toLowerCase();
  const url = process.env.DB_URL || 'sqlite:auth.db';

  if (type === 'postgres') {
    return {
      type: 'postgres' as const,
      url,
      ssl: false,
      entities: [User],
      synchronize: true, // dev only; disable in prod and use migrations
    };
  }

  // sqlite
  const dbFile = url.startsWith('sqlite:') ? url.split(':')[1] : 'auth.db';
  return {
    type: 'sqlite' as const,
    database: dbFile,
    entities: [User],
    synchronize: true, // dev only
  };
}

@Module({
  imports: [
    TypeOrmModule.forRoot(parseDb()),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
