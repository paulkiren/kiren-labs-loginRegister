
import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword } from '../common/hash.util';
import { USERS_REPOSITORY, UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: UsersRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existingEmail = await this.usersRepo.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUsername = await this.usersRepo.findByUsername(dto.username);
    if (existingUsername) throw new ConflictException('Username already taken');

    const user = await this.usersRepo.create({
      email: dto.email,
      username: dto.username,
      hashedPassword: await hashPassword(dto.password),
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepo.findByEmail(email);
  }

  async findById(id: number): Promise<User | null> {
    return await this.usersRepo.findById(id);
  }
}
