import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserRecord, UsersRepository } from './users.repository';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(record: CreateUserRecord): Promise<User> {
    const user = this.repo.create({
      email: record.email,
      username: record.username,
      hashedPassword: record.hashedPassword,
    });
    return await this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repo.findOne({ where: { username } });
  }
}