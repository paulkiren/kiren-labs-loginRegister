import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
  });

  describe('create', () => {
    it('should create a user', async () => {
      // Arrange
      const createData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
      };

      const expectedUser = {
        id: 'user-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: createData });
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      // Arrange
      const userId = 'user-1';
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      // Arrange
      const email = 'test@example.com';
      const expectedUser = {
        id: 'user-1',
        email,
        name: 'Test User',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null when email not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      // Arrange
      const userId = 'user-1';
      const updateData = { name: 'Updated Name' };
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.update(userId, updateData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { ...updateData, updatedAt: expect.any(Date) },
      });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      // Arrange
      const userId = 'user-1';
      prisma.user.delete.mockResolvedValue({} as any);

      // Act
      await repository.delete(userId);

      // Assert
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const expectedUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          passwordHash: 'hash1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          passwordHash: 'hash2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.user.findMany.mockResolvedValue(expectedUsers);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(expectedUsers);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      prisma.user.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
