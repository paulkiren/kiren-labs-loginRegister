import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

export class PasswordResetFactory {
  constructor(private prisma: PrismaClient) {}

  async create(
    userId: string,
    overrides?: Partial<{
      token: string;
      expiresAt: Date;
      usedAt: Date | null;
    }>,
  ) {
    const token = overrides?.token || this.generateToken();
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const reset = await this.prisma.passwordReset.create({
      data: {
        userId,
        tokenHash,
        expiresAt:
          overrides?.expiresAt || new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        usedAt: overrides?.usedAt ?? null,
      },
    });

    // Return reset with plain token for testing
    return { ...reset, token };
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
