import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class TokenService implements OnModuleInit {
  private privateKey: string;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const privateKeyPath = this.config.get('PRIVATE_KEY_PATH') || resolve(__dirname, '../../../../secrets/jwt.key');
    
    try {
      if (existsSync(privateKeyPath)) {
        this.privateKey = readFileSync(privateKeyPath, 'utf8');
      } else {
        console.warn(`Private key not found at ${privateKeyPath}`);
      }
    } catch (error) {
      console.warn('Failed to read private key:', error.message);
    }
  }

  signAccessToken(userId: string): string {
    const payload = { sub: userId };
    const options = {
      algorithm: 'RS256' as const,
      expiresIn: this.config.get('ACCESS_TTL') || '15m',
      issuer: this.config.get('JWT_ISS') || 'https://api.local',
      audience: this.config.get('JWT_AUD') || 'https://api.local',
    };

    if (this.privateKey) {
      return this.jwtService.sign(payload, {
        ...options,
        privateKey: this.privateKey,
      });
    }

    return this.jwtService.sign(payload, options);
  }

  async verifyAccessToken(token: string): Promise<any> {
    if (this.privateKey) {
      return this.jwtService.verify(token, {
        algorithms: ['RS256'],
        issuer: this.config.get('JWT_ISS') || 'https://api.local',
        audience: this.config.get('JWT_AUD') || 'https://api.local',
      });
    }
    return this.jwtService.verify(token);
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
