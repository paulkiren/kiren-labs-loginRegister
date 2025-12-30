import { CryptoService } from '../../src/domain/ports/crypto.service';

export const createMockCryptoService = (): jest.Mocked<CryptoService> => ({
  hashPassword: jest.fn().mockResolvedValue('$argon2id$hashedpassword'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  hashToken: jest.fn().mockReturnValue('hashedtoken'),
  generateToken: jest.fn().mockReturnValue('generatedtoken'),
});
