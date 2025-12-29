export interface PasswordResetRepository {
  create(data: CreatePasswordResetData): Promise<PasswordResetEntity>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetEntity | null>;
  markAsUsed(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
}

export interface CreatePasswordResetData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface PasswordResetEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
