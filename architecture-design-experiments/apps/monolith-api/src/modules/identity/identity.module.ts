import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';

import { IdentityController } from './identity.controller';
import { AuthService } from './services/auth.service';
import { JwksService } from './services/jwks.service';
import { TokenService } from './services/token.service';

import { PrismaUserRepository } from '../../infrastructure/adapters/prisma-user.repository';
import { PrismaRefreshSessionRepository } from '../../infrastructure/adapters/prisma-refresh-session.repository';
import { PrismaPasswordResetRepository } from '../../infrastructure/adapters/prisma-password-reset.repository';
import { NodeCryptoService } from '../../infrastructure/adapters/node-crypto.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const privateKeyPath = config.get('PRIVATE_KEY_PATH') || join(process.cwd(), '../../secrets/jwt.key');
        const privateKey = readFileSync(privateKeyPath, 'utf8');
        
        return {
          privateKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: config.get('ACCESS_TTL') || '15m',
            issuer: config.get('JWT_ISS') || 'https://api.local',
            audience: config.get('JWT_AUD') || 'https://api.local',
          },
        };
      },
    }),
  ],
  controllers: [IdentityController],
  providers: [
    AuthService,
    JwksService,
    TokenService,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
    { provide: 'RefreshSessionRepository', useClass: PrismaRefreshSessionRepository },
    { provide: 'PasswordResetRepository', useClass: PrismaPasswordResetRepository },
    { provide: 'CryptoService', useClass: NodeCryptoService },
  ],
  exports: [TokenService],
})
export class IdentityModule {}
