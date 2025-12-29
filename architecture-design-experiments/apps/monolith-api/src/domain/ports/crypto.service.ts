export interface CryptoService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  hashToken(token: string): string;
  generateToken(length?: number): string;
}
