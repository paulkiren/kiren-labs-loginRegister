import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../../domain/ports/user.repository';
import { UpdateUserDto } from '../dto';

@Injectable()
export class UserProfileService {
  constructor(@Inject('UserRepository') private userRepo: UserRepository) {}

  async findAll() {
    const users = await this.userRepo.findAll();
    return users.map((u) => this.toPublic(u));
  }

  async findById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.userRepo.update(id, dto);
    return this.toPublic(updated);
  }

  async delete(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepo.delete(id);
  }

  private toPublic(user: any) {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
