import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class TokenService implements OnModuleInit {
  private privateKey: string;
  private publicKey: string;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    // __dirname is src/modules/identity/services in the source code
    // Need to go up 4 levels to reach architecture-design-experiments root where secrets are
    // src/modules/identity/services -> src -> modules -> identity -> services -> apps -> monolith-api -> architecture-design-experiments
    const workspaceRoot = resolve(__dirname, '../../../../../..');
    const privateKeyPath = resolve(workspaceRoot, 'secrets/jwt.key');
    const publicKeyPath = resolve(workspaceRoot, 'secrets/jwt.pem');
    
    try {
      if (existsSync(privateKeyPath)) {
        this.privateKey = readFileSync(privateKeyPath, 'utf8');
        console.log('✓ JWT private key loaded');
      } else {
        console.warn(`✗ Private key not found at ${privateKeyPath}`);
      }
      
      if (existsSync(publicKeyPath)) {
        this.publicKey = readFileSync(publicKeyPath, 'utf8');
        console.log('✓ JWT public key loaded');
      } else {
        console.warn(`✗ Public key not found at ${publicKeyPath}`);
      }
    } catch (error) {
      console.warn('Failed to read JWT keys:', error.message);
    }
  }

  signAccessToken(userId: string): string {
    const payload = { sub: userId };
    const options = {
      algorithm: 'RS256' as const,
      expiresIn: this.config.get('ACCESS_TTL') || '15m',
      issuer: this.config.get('JWT_ISS') || 'https://api.local',
      audience: this.config.get('JWT_AUD') || 'https://api.local',
      secret: this.privateKey,
    };

    return this.jwtService.sign(payload, options);
  }

  async verifyAccessToken(token: string): Promise<any> {
    return this.jwtService.verify(token, {
      algorithms: ['RS256'],
      secret: this.publicKey,
      issuer: this.config.get('JWT_ISS') || 'https://api.local',
      audience: this.config.get('JWT_AUD') || 'https://api.local',
    });
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
