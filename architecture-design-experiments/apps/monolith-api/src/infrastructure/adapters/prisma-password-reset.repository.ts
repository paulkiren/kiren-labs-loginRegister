import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  PasswordResetRepository,
  CreatePasswordResetData,
  PasswordResetEntity,
} from '../../domain/ports/password-reset.repository';

@Injectable()
export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePasswordResetData): Promise<PasswordResetEntity> {
    return this.prisma.passwordReset.create({ data });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetEntity | null> {
    return this.prisma.passwordReset.findUnique({ where: { tokenHash } });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.passwordReset.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
