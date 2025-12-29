export interface UserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, data: UpdateUserData): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  findAll(): Promise<UserEntity[]>;
}

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

export interface UpdateUserData {
  name?: string;
  passwordHash?: string;
}

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
