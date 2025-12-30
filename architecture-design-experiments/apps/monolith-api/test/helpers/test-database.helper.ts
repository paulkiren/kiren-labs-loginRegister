import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestDatabaseHelper {
  private prisma: PrismaClient;
  private databaseUrl: string;

  constructor() {
    // Use test database URL from environment or default
    this.databaseUrl =
      process.env.POSTGRES_URL ||
      'postgresql://postgres:postgres@localhost:5433/test_db';

    this.prisma = new PrismaClient({
      datasources: { db: { url: this.databaseUrl } },
    });
  }

  async setup(): Promise<void> {
    // Run migrations on test database
    try {
      execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
        env: { ...process.env, DATABASE_URL: this.databaseUrl },
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('Failed to run migrations:', error);
      throw error;
    }

    await this.prisma.$connect();
  }

  async cleanup(): Promise<void> {
    // Clean all tables in reverse order (respecting FK constraints)
    try {
      await this.prisma.passwordReset.deleteMany();
      await this.prisma.refreshSession.deleteMany();
      await this.prisma.user.deleteMany();
    } catch (error) {
      console.error('Failed to cleanup database:', error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    await this.prisma.$disconnect();
  }

  getClient(): PrismaClient {
    return this.prisma;
  }
}
