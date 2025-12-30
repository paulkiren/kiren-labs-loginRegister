import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service';

describe('POST /auth/register (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same pipes and middleware as the real app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up database after each test
    await prisma.passwordReset.deleteMany();
    await prisma.refreshSession.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('successful registration', () => {
    it('should register a new user with valid data', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenId: expect.any(String),
        expiresIn: 900,
        tokenType: 'Bearer',
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(registerDto.email);
      expect(user?.name).toBe(registerDto.name);

      // Verify refresh session was created
      const session = await prisma.refreshSession.findUnique({
        where: { id: response.body.tokenId },
      });
      expect(session).toBeDefined();
      expect(session?.userId).toBe(user?.id);
    });

    it('should hash the password securely', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'MySecretPassword123!',
        name: 'Test User',
      };

      // Act
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Assert - password should be hashed, not plain text
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      expect(user?.passwordHash).not.toBe(registerDto.password);
      expect(user?.passwordHash).toContain('$argon2'); // Argon2 hash format
    });
  });

  describe('validation errors', () => {
    it('should reject registration with duplicate email', async () => {
      // Arrange - create existing user
      const existingUser = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(existingUser)
        .expect(201);

      // Act - try to register with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com', // Same email
          password: 'DifferentPass123!',
          name: 'Another User',
        })
        .expect(409); // Conflict

      // Assert
      expect(response.body.message).toContain('already registered');
    });

    it('should reject registration with invalid email format', async () => {
      // Arrange
      const invalidDto = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);

      // Assert
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('email')]),
      );
    });

    it('should reject registration with weak password (too short)', async () => {
      // Arrange
      const weakPasswordDto = {
        email: 'test@example.com',
        password: 'short', // Less than 8 characters
        name: 'Test User',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordDto)
        .expect(400);

      // Assert
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('password must be longer'),
        ]),
      );
    });

    it('should reject registration with missing required fields', async () => {
      // Arrange - missing name
      const incompleteDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        // name is missing
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteDto)
        .expect(400);

      // Assert
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('name')]),
      );
    });

    it('should reject registration with extra unexpected fields', async () => {
      // Arrange
      const dtoWithExtra = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        isAdmin: true, // Unexpected field
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dtoWithExtra)
        .expect(400);

      // Assert
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('should not exist')]),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle email case-insensitivity', async () => {
      // Arrange
      const user1 = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'User 1',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(201);

      // Act - try to register with same email but different case
      const user2 = {
        email: 'TEST@EXAMPLE.COM', // Different case
        password: 'Password456!',
        name: 'User 2',
      };

      // This test depends on your database configuration
      // If you have case-insensitive email constraints, this should fail
      // Otherwise, you may want to add application-level checks
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2);
      // Add your expected behavior here
    });

    it('should allow registration with minimum valid data', async () => {
      // Arrange
      const minimalDto = {
        email: 'minimal@example.com',
        password: '12345678', // Exactly 8 characters (minimum)
        name: 'AB', // Exactly 2 characters (minimum)
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(minimalDto)
        .expect(201);

      // Assert
      expect(response.body.accessToken).toBeDefined();
    });
  });

  describe('security', () => {
    it('should not expose sensitive data in response', async () => {
      // Arrange
      const registerDto = {
        email: 'secure@example.com',
        password: 'SecurePass123!',
        name: 'Secure User',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Assert - response should not contain password or hash
      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.user?.password).toBeUndefined();
      expect(response.body.user?.passwordHash).toBeUndefined();
    });

    it('should create unique refresh tokens for each registration', async () => {
      // Arrange
      const user1 = {
        email: 'user1@example.com',
        password: 'Password123!',
        name: 'User 1',
      };
      const user2 = {
        email: 'user2@example.com',
        password: 'Password123!',
        name: 'User 2',
      };

      // Act
      const response1 = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2)
        .expect(201);

      // Assert
      expect(response1.body.refreshToken).not.toBe(response2.body.refreshToken);
      expect(response1.body.accessToken).not.toBe(response2.body.accessToken);
      expect(response1.body.tokenId).not.toBe(response2.body.tokenId);
    });
  });
});
