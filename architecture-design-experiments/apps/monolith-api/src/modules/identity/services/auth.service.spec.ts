import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import {
  createMockUserRepository,
  createMockRefreshSessionRepository,
  createMockPasswordResetRepository,
} from '../../../../test/mocks/repository.mocks';
import { createMockCryptoService } from '../../../../test/mocks/crypto.mock';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof createMockUserRepository>;
  let sessionRepo: ReturnType<typeof createMockRefreshSessionRepository>;
  let resetRepo: ReturnType<typeof createMockPasswordResetRepository>;
  let crypto: ReturnType<typeof createMockCryptoService>;
  let tokenService: jest.Mocked<TokenService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Create mocks
    userRepo = createMockUserRepository();
    sessionRepo = createMockRefreshSessionRepository();
    resetRepo = createMockPasswordResetRepository();
    crypto = createMockCryptoService();
    tokenService = {
      signAccessToken: jest.fn(),
    } as any;
    configService = {
      get: jest.fn(),
    } as any;

    // Setup default config responses
    configService.get.mockImplementation((key: string) => {
      if (key === 'REFRESH_TTL_SECONDS') return '604800';
      if (key === 'RESET_TOKEN_TTL_MINUTES') return '30';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserRepository', useValue: userRepo },
        { provide: 'RefreshSessionRepository', useValue: sessionRepo },
        { provide: 'PasswordResetRepository', useValue: resetRepo },
        { provide: 'CryptoService', useValue: crypto },
        { provide: TokenService, useValue: tokenService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const dto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      userRepo.findByEmail.mockResolvedValue(null); // No existing user
      userRepo.create.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: dto.name,
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      crypto.hashPassword.mockResolvedValue('hashed-password');
      tokenService.signAccessToken.mockReturnValue('access-token');
      crypto.generateToken.mockReturnValue('refresh-token');
      crypto.hashToken.mockReturnValue('hashed-token');
      sessionRepo.create.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        deviceFingerprint: null,
        expiresAt: new Date(),
        lastUsedAt: new Date(),
        revokedAt: null,
        reuseDetectedAt: null,
        createdAt: new Date(),
      });

      // Act
      const result = await service.register(dto);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenId: 'session-1',
        expiresIn: 900,
        tokenType: 'Bearer',
      });
      expect(userRepo.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(crypto.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(userRepo.create).toHaveBeenCalledWith({
        email: dto.email,
        name: dto.name,
        passwordHash: 'hashed-password',
      });
      expect(tokenService.signAccessToken).toHaveBeenCalledWith('user-1');
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const dto = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      userRepo.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: dto.email,
        name: 'Existing User',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      await expect(service.register(dto)).rejects.toThrow(
        'Email already registered',
      );
      expect(userRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const dto = {
        email: 'test@example.com',
        password: 'CorrectPassword',
      };

      userRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: 'Test User',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      crypto.verifyPassword.mockResolvedValue(true);
      tokenService.signAccessToken.mockReturnValue('access-token');
      crypto.generateToken.mockReturnValue('refresh-token');
      crypto.hashToken.mockReturnValue('hashed-token');
      sessionRepo.create.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        deviceFingerprint: null,
        expiresAt: new Date(),
        lastUsedAt: new Date(),
        revokedAt: null,
        reuseDetectedAt: null,
        createdAt: new Date(),
      });

      // Act
      const result = await service.login(dto);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenId: 'session-1',
        expiresIn: 900,
        tokenType: 'Bearer',
      });
      expect(crypto.verifyPassword).toHaveBeenCalledWith(
        dto.password,
        'hashed-password',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      const dto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      userRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: 'Test User',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      crypto.verifyPassword.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      const dto = {
        email: 'nonexistent@example.com',
        password: 'SomePassword',
      };

      userRepo.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      // Arrange
      const dto = {
        tokenId: 'session-1',
        token: 'valid-refresh-token',
      };

      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      sessionRepo.findById.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        deviceFingerprint: null,
        lastUsedAt: new Date(),
        expiresAt: futureDate,
        revokedAt: null,
        reuseDetectedAt: null,
        createdAt: new Date(),
      });
      crypto.hashToken.mockReturnValue('hashed-token');
      sessionRepo.deleteById.mockResolvedValue(undefined);
      tokenService.signAccessToken.mockReturnValue('new-access-token');
      crypto.generateToken.mockReturnValue('new-refresh-token');
      sessionRepo.create.mockResolvedValue({
        id: 'session-2',
        userId: 'user-1',
        tokenHash: 'new-hashed-token',
        deviceFingerprint: null,
        lastUsedAt: new Date(),
        expiresAt: new Date(),
        revokedAt: null,
        reuseDetectedAt: null,
        createdAt: new Date(),
      });

      // Act
      const result = await service.refresh(dto);

      // Assert
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenId: 'session-2',
        expiresIn: 900,
      });
      expect(sessionRepo.deleteById).toHaveBeenCalledWith('session-1');
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Arrange
      const dto = {
        tokenId: 'session-1',
        token: 'expired-token',
      };

      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      sessionRepo.findById.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        deviceFingerprint: null,
        lastUsedAt: new Date(),
        expiresAt: pastDate,
        revokedAt: null,
        reuseDetectedAt: null,
        createdAt: new Date(),
      });
      sessionRepo.deleteById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.refresh(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(dto)).rejects.toThrow(
        'Refresh token expired',
      );
      expect(sessionRepo.deleteById).toHaveBeenCalledWith('session-1');
    });

    it('should throw UnauthorizedException for revoked session', async () => {
      // Arrange
      const dto = {
        tokenId: 'session-1',
        token: 'some-token',
      };

      sessionRepo.findById.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        deviceFingerprint: null,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: new Date(),
        reuseDetectedAt: null,
        createdAt: new Date(),
      });

      // Act & Assert
      await expect(service.refresh(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(dto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should detect token reuse and revoke all sessions', async () => {
      // Arrange
      const dto = {
        tokenId: 'session-1',
        token: 'wrong-token',
      };

      sessionRepo.findById.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        tokenHash: 'correct-hash',
        deviceFingerprint: null,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
        reuseDetectedAt: null,
        createdAt: new Date(),
      });
      crypto.hashToken.mockReturnValue('wrong-hash'); // Different hash
      sessionRepo.update.mockResolvedValue(undefined as any);
      sessionRepo.revokeAllForUser.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.refresh(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(dto)).rejects.toThrow(
        'Token reuse detected',
      );
      expect(sessionRepo.update).toHaveBeenCalledWith('session-1', {
        reuseDetectedAt: expect.any(Date),
      });
      expect(sessionRepo.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      const dto = { tokenId: 'session-1' };
      sessionRepo.deleteById.mockResolvedValue(undefined);

      // Act
      const result = await service.logout(dto);

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(sessionRepo.deleteById).toHaveBeenCalledWith('session-1');
    });
  });

  describe('requestPasswordReset', () => {
    it('should create reset token for existing user', async () => {
      // Arrange
      const dto = { email: 'test@example.com' };
      userRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: 'Test User',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      crypto.generateToken.mockReturnValue('reset-token');
      crypto.hashToken.mockReturnValue('hashed-reset-token');
      resetRepo.create.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        tokenHash: 'hashed-reset-token',
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      });

      // Spy on console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.requestPasswordReset(dto);

      // Assert
      expect(result).toEqual({
        message: 'If the email exists, a reset link has been sent',
      });
      expect(resetRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        tokenHash: 'hashed-reset-token',
        expiresAt: expect.any(Date),
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('reset-token'),
      );

      consoleSpy.mockRestore();
    });

    it('should return generic message for non-existent user', async () => {
      // Arrange
      const dto = { email: 'nonexistent@example.com' };
      userRepo.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.requestPasswordReset(dto);

      // Assert
      expect(result).toEqual({
        message: 'If the email exists, a reset link has been sent',
      });
      expect(resetRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    it('should reset password successfully', async () => {
      // Arrange
      const dto = {
        token: 'valid-reset-token',
        password: 'NewPassword123!',
      };

      crypto.hashToken.mockReturnValue('hashed-reset-token');
      resetRepo.findByTokenHash.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        tokenHash: 'hashed-reset-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min future
        usedAt: null,
        createdAt: new Date(),
      });
      crypto.hashPassword.mockResolvedValue('new-hashed-password');
      userRepo.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'new-hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      resetRepo.markAsUsed.mockResolvedValue(undefined as any);

      // Act
      const result = await service.confirmPasswordReset(dto);

      // Assert
      expect(result).toEqual({ message: 'Password reset successful' });
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hashed-password',
      });
      expect(resetRepo.markAsUsed).toHaveBeenCalledWith('reset-1');
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Arrange
      const dto = {
        token: 'expired-token',
        password: 'NewPassword123!',
      };

      crypto.hashToken.mockReturnValue('hashed-token');
      resetRepo.findByTokenHash.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min past
        usedAt: null,
        createdAt: new Date(),
      });

      // Act & Assert
      await expect(service.confirmPasswordReset(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.confirmPasswordReset(dto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw UnauthorizedException for already used token', async () => {
      // Arrange
      const dto = {
        token: 'used-token',
        password: 'NewPassword123!',
      };

      crypto.hashToken.mockReturnValue('hashed-token');
      resetRepo.findByTokenHash.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        usedAt: new Date(), // Already used
        createdAt: new Date(),
      });

      // Act & Assert
      await expect(service.confirmPasswordReset(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      const dto = {
        token: 'invalid-token',
        password: 'NewPassword123!',
      };

      crypto.hashToken.mockReturnValue('hashed-token');
      resetRepo.findByTokenHash.mockResolvedValue(null);

      // Act & Assert
      await expect(service.confirmPasswordReset(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
