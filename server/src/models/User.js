import { randomUUID } from "crypto";

export class User {
  constructor({ id, name, email, passwordHash, salt, createdAt, updatedAt }) {
    this.id = id || randomUUID();
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.salt = salt;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromData(data) {
    return new User(data);
  }
}
