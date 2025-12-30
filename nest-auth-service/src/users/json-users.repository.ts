import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { User } from './user.entity';

type PartialUser = Partial<User> & { email: string; username: string; hashedPassword: string; id?: number };

@Injectable()
export class JsonUsersRepository {
  private filePath = join(process.cwd(), 'data', 'users.json');

  private async readAll(): Promise<User[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      if (!raw) return [];
      return JSON.parse(raw) as User[];
    } catch (err) {
      return [];
    }
  }

  private async writeAll(users: User[]): Promise<void> {
    const dir = dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmp = this.filePath + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(users, null, 2), 'utf8');
    await fs.rename(tmp, this.filePath);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const list = await this.readAll();
    return list.find(u => u.email === email) ?? null;
  }

  async findOneById(id: number): Promise<User | null> {
    const list = await this.readAll();
    return list.find(u => u.id === id) ?? null;
  }

  async findOneByUsername(username: string): Promise<User | null> {
    const list = await this.readAll();
    return list.find(u => u.username === username) ?? null;
  }

  async create(payload: PartialUser): Promise<User> {
    const list = await this.readAll();
    const nextId = list.length ? Math.max(...list.map(u => u.id ?? 0)) + 1 : 1;
    const user: User = {
      id: nextId,
      email: payload.email!,
      username: payload.username!,
      hashedPassword: payload.hashedPassword!,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    list.push(user);
    await this.writeAll(list);
    return user;
  }

  async save(user: User): Promise<User> {
    const list = await this.readAll();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) list[idx] = user;
    else list.push(user);
    await this.writeAll(list);
    return user;
  }
}
