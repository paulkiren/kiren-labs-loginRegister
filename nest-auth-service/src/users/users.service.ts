
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword } from '../common/hash.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existingEmail = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUsername = await this.usersRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictException('Username already taken');

    const user = this.usersRepo.create({
      email: dto.email,
      username: dto.username,
      hashedPassword: await hashPassword(dto.password),
    });
    return await this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return await this.usersRepo.findOne({ where: { id } });
  }
}
