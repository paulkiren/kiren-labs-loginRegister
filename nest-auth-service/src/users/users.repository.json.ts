
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { JsonDb } from '../db/json-db';
import { hashPassword } from '../common/hash.util';

export class JsonUsersRepository implements UsersRepository {
  private db: JsonDb;

  constructor(filePath: string) {
    this.db = new JsonDb(filePath);
  }

  private toUser(obj: any): User {
    return Object.assign(new User(), obj);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const data = await this.db.read();
    // Uniqueness checks here to keep UsersService simpler (or keep in service if you prefer)
    if (data.users.some(u => u.email === dto.email)) {
      throw new Error('Email already registered');
    }
    if (data.users.some(u => u.username === dto.username)) {
      throw new Error('Username already taken');
    }
    const id = ++data.lastId;
    const user: User = {
      id,
      email: dto.email,
      username: dto.username,
      hashedPassword: await hashPassword(dto.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    data.users.push(user);
    await this.db.write(data);
    return this.toUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.db.read();
    const u = data.users.find(u => u.email === email);
    return u ? this.toUser(u) : null;
  }

  async findById(id: number): Promise<User | null> {
    const data = await this.db.read();
    const u = data.users.find(u => u.id === id);
    return u ? this.toUser(u) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const data = await this.db.read();
    const u = data.users.find(u => u.username === username);
    return u ? this.toUser(u) : null;
  }
}
