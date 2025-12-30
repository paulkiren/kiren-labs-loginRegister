import { User } from './user.entity';

export type CreateUserRecord = {
  email: string;
  username: string;
  hashedPassword: string;
};

export interface UsersRepository {
  create(record: CreateUserRecord): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');