import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

export class RefreshSessionFactory {
  constructor(private prisma: PrismaClient) {}

  async create(
    userId: string,
    overrides?: Partial<{
      token: string;
      expiresAt: Date;
      revokedAt: Date | null;
      reuseDetectedAt: Date | null;
    }>,
  ) {
    const token = overrides?.token || this.generateToken();
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const session = await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        deviceFingerprint: null,
        lastUsedAt: new Date(),
        expiresAt:
          overrides?.expiresAt ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        revokedAt: overrides?.revokedAt ?? null,
        reuseDetectedAt: overrides?.reuseDetectedAt ?? null,
      },
    });

    // Return session with plain token for testing
    return { ...session, token };
  }

  private generateToken(): string {
    return randomBytes(48).toString('hex');
  }
}
