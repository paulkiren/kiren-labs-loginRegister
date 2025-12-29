export interface RefreshSessionRepository {
  create(data: CreateSessionData): Promise<RefreshSessionEntity>;
  findById(id: string): Promise<RefreshSessionEntity | null>;
  findByTokenHash(tokenHash: string): Promise<RefreshSessionEntity | null>;
  update(id: string, data: UpdateSessionData): Promise<RefreshSessionEntity>;
  deleteById(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  deviceFingerprint?: string;
  expiresAt: Date;
}

export interface UpdateSessionData {
  lastUsedAt?: Date;
  revokedAt?: Date;
  reuseDetectedAt?: Date;
}

export interface RefreshSessionEntity {
  id: string;
  userId: string;
  tokenHash: string;
  deviceFingerprint: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  reuseDetectedAt: Date | null;
}
