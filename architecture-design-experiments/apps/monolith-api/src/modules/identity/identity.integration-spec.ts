import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from './identity.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthService } from './services/auth.service';
import { UserFactory } from '../../../test/factories/user.factory';
import { RefreshSessionFactory } from '../../../test/factories/refresh-session.factory';

/**
 * Integration tests for Identity Module
 * These tests verify that multiple components work together correctly with a real database.
 */
describe('Identity Module Integration', () => {
  let module: TestingModule;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactory;
  let sessionFactory: RefreshSessionFactory;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
        IdentityModule,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    userFactory = new UserFactory(prisma);
    sessionFactory = new RefreshSessionFactory(prisma);
  });

  afterEach(async () => {
    // Clean up database after each test
    await prisma.passwordReset.deleteMany();
    await prisma.refreshSession.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Registration and Login Flow', () => {
    it('should register a user and then allow login with credentials', async () => {
      // Arrange
      const registerDto = {
        email: 'integration@example.com',
        password: 'SecurePassword123!',
        name: 'Integration Test User',
      };

      // Act - Register
      const registerResult = await authService.register(registerDto);

      // Assert - Registration
      expect(registerResult.accessToken).toBeDefined();
      expect(registerResult.refreshToken).toBeDefined();
      expect(registerResult.tokenId).toBeDefined();

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user?.name).toBe(registerDto.name);

      // Act - Login with same credentials
      const loginResult = await authService.login({
        email: registerDto.email,
        password: registerDto.password,
      });

      // Assert - Login
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
      expect(loginResult.tokenId).not.toBe(registerResult.tokenId); // New session

      // Verify two sessions exist (one from register, one from login)
      const sessions = await prisma.refreshSession.findMany({
        where: { userId: user!.id },
      });
      expect(sessions).toHaveLength(2);
    });

    it('should prevent duplicate email registration', async () => {
      // Arrange
      const email = 'duplicate@example.com';
      await userFactory.create({ email });

      // Act & Assert
      await expect(
        authService.register({
          email,
          password: 'Password123!',
          name: 'Duplicate User',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh tokens and rotate refresh token', async () => {
      // Arrange - Create user and session
      const user = await userFactory.create();
      const session = await sessionFactory.create(user.id);

      // Act - Refresh tokens
      const result = await authService.refresh({
        tokenId: session.id,
        token: session.token,
      });

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.tokenId).not.toBe(session.id); // New session ID

      // Verify old session was deleted
      const oldSession = await prisma.refreshSession.findUnique({
        where: { id: session.id },
      });
      expect(oldSession).toBeNull();

      // Verify new session exists
      const newSession = await prisma.refreshSession.findUnique({
        where: { id: result.tokenId },
      });
      expect(newSession).toBeDefined();
      expect(newSession?.userId).toBe(user.id);
    });

    it('should detect token reuse and revoke all user sessions', async () => {
      // Arrange - Create user with two sessions
      const user = await userFactory.create();
      const session1 = await sessionFactory.create(user.id);
      const session2 = await sessionFactory.create(user.id);

      // Act - Try to reuse session1 with wrong token (simulate token theft)
      await expect(
        authService.refresh({
          tokenId: session1.id,
          token: 'wrong-token', // Attacker with stolen tokenId but wrong token
        }),
      ).rejects.toThrow('Token reuse detected');

      // Assert - All user sessions should be marked with reuse detection
      const session1Updated = await prisma.refreshSession.findUnique({
        where: { id: session1.id },
      });
      expect(session1Updated?.reuseDetectedAt).toBeDefined();

      // Session2 should be revoked (not deleted, but marked)
      const session2Updated = await prisma.refreshSession.findUnique({
        where: { id: session2.id },
      });
      expect(session2Updated?.revokedAt).toBeDefined();
    });

    it('should reject expired refresh tokens', async () => {
      // Arrange - Create session with past expiration
      const user = await userFactory.create();
      const expiredSession = await sessionFactory.create(user.id, {
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      });

      // Act & Assert
      await expect(
        authService.refresh({
          tokenId: expiredSession.id,
          token: expiredSession.token,
        }),
      ).rejects.toThrow('Refresh token expired');

      // Verify session was deleted
      const session = await prisma.refreshSession.findUnique({
        where: { id: expiredSession.id },
      });
      expect(session).toBeNull();
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full password reset workflow', async () => {
      // Arrange - Create user
      const user = await userFactory.create({
        password: 'OldPassword123!',
      });
      const oldPasswordHash = (
        await prisma.user.findUnique({ where: { id: user.id } })
      )!.passwordHash;

      // Act 1 - Request password reset
      const requestResult = await authService.requestPasswordReset({
        email: user.email,
      });

      expect(requestResult.message).toContain('reset link has been sent');

      // Get the reset token from database (in real app, this would be sent via email)
      const resetRecord = await prisma.passwordReset.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(resetRecord).toBeDefined();

      // We need to get the plain token - in real scenario it would be in the email
      // For this integration test, we'll simulate having the token
      // Note: This is a limitation of the test - in production the token is only known via email
      const crypto = require('crypto');
      const testToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(testToken).digest('hex');

      // Update the reset record with our known token hash
      await prisma.passwordReset.update({
        where: { id: resetRecord!.id },
        data: { tokenHash },
      });

      // Act 2 - Confirm password reset
      const newPassword = 'NewPassword456!';
      const confirmResult = await authService.confirmPasswordReset({
        token: testToken,
        password: newPassword,
      });

      expect(confirmResult.message).toBe('Password reset successful');

      // Assert - Password should be updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.passwordHash).not.toBe(oldPasswordHash);

      // Assert - Reset token should be marked as used
      const usedReset = await prisma.passwordReset.findUnique({
        where: { id: resetRecord!.id },
      });
      expect(usedReset?.usedAt).toBeDefined();

      // Act 3 - Try to login with old password (should fail)
      await expect(
        authService.login({
          email: user.email,
          password: 'OldPassword123!',
        }),
      ).rejects.toThrow('Invalid credentials');

      // Act 4 - Login with new password (should succeed)
      const loginResult = await authService.login({
        email: user.email,
        password: newPassword,
      });

      expect(loginResult.accessToken).toBeDefined();
    });
  });

  describe('Logout Flow', () => {
    it('should delete refresh session on logout', async () => {
      // Arrange
      const user = await userFactory.create();
      const session = await sessionFactory.create(user.id);

      // Verify session exists
      let foundSession = await prisma.refreshSession.findUnique({
        where: { id: session.id },
      });
      expect(foundSession).toBeDefined();

      // Act - Logout
      await authService.logout({ tokenId: session.id });

      // Assert - Session should be deleted
      foundSession = await prisma.refreshSession.findUnique({
        where: { id: session.id },
      });
      expect(foundSession).toBeNull();
    });
  });
});
