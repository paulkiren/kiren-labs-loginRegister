import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  RefreshSessionRepository,
  CreateSessionData,
  UpdateSessionData,
  RefreshSessionEntity,
} from '../../domain/ports/refresh-session.repository';

@Injectable()
export class PrismaRefreshSessionRepository implements RefreshSessionRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSessionData): Promise<RefreshSessionEntity> {
    return this.prisma.refreshSession.create({ data });
  }

  async findById(id: string): Promise<RefreshSessionEntity | null> {
    return this.prisma.refreshSession.findUnique({ where: { id } });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSessionEntity | null> {
    return this.prisma.refreshSession.findUnique({ where: { tokenHash } });
  }

  async update(id: string, data: UpdateSessionData): Promise<RefreshSessionEntity> {
    return this.prisma.refreshSession.update({ where: { id }, data });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.refreshSession.delete({ where: { id } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
