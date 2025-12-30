import { sign } from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export class JwtTestHelper {
  private privateKey: string;

  constructor() {
    const keyPath = resolve(__dirname, '../fixtures/test-jwt.key');
    this.privateKey = readFileSync(keyPath, 'utf8');
  }

  generateAccessToken(userId: string, expiresIn = '15m'): string {
    return sign({ sub: userId }, this.privateKey, {
      algorithm: 'RS256',
      expiresIn,
      issuer: 'https://api.local',
      audience: 'https://api.local',
    });
  }

  generateExpiredToken(userId: string): string {
    return this.generateAccessToken(userId, '-1h');
  }

  generateInvalidToken(): string {
    // Generate with wrong key
    return sign({ sub: 'user-id' }, 'wrong-secret', {
      algorithm: 'HS256',
    });
  }
}
