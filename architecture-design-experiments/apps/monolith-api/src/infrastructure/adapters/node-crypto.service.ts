import { Injectable } from '@nestjs/common';
import { CryptoService } from '../../domain/ports/crypto.service';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class NodeCryptoService implements CryptoService {
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateToken(length = 48): string {
    return randomBytes(length).toString('hex');
  }
}
