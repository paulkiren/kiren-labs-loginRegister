import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';

export class UserFactory {
  constructor(private prisma: PrismaClient) {}

  async create(
    overrides?: Partial<{
      email: string;
      name: string;
      password: string;
    }>,
  ) {
    const password = overrides?.password || 'TestPassword123!';
    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email: overrides?.email || faker.internet.email(),
        name: overrides?.name || faker.person.fullName(),
        passwordHash,
      },
    });

    // Return user with plain password for testing
    return { ...user, password };
  }

  async createMany(count: number) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create());
    }
    return users;
  }
}
