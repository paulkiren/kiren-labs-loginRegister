import fs from "fs/promises";
import path from "path";
import { config } from "../config/index.js";

class Storage {
  constructor() {
    this.users = new Map();
    this.refreshTokens = new Map();
    this.resetTokens = new Map();
    this.dataDir = config.dataDir;
    this.usersFile = path.join(this.dataDir, "users.json");
    this.refreshTokensFile = path.join(this.dataDir, "refresh-tokens.json");
    this.resetTokensFile = path.join(this.dataDir, "reset-tokens.json");
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadUsers();
      await this.loadRefreshTokens();
      await this.loadResetTokens();
      this.isInitialized = true;
      console.log("✅ Storage initialized");
    } catch (error) {
      console.error("❌ Storage initialization failed:", error.message);
      throw error;
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, "utf-8");
      const users = JSON.parse(data);
      this.users = new Map(Object.entries(users));
      console.log(`📦 Loaded ${this.users.size} users`);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("📦 No existing users file, starting fresh");
        this.users = new Map();
      } else {
        throw error;
      }
    }
  }

  async loadRefreshTokens() {
    try {
      const data = await fs.readFile(this.refreshTokensFile, "utf-8");
      const tokens = JSON.parse(data);
      this.refreshTokens = new Map(Object.entries(tokens));
      // Clean expired tokens
      const now = Date.now();
      for (const [id, token] of this.refreshTokens.entries()) {
        if (now > token.expiresAt) {
          this.refreshTokens.delete(id);
        }
      }
      console.log(`🔑 Loaded ${this.refreshTokens.size} refresh tokens`);
    } catch (error) {
      if (error.code === "ENOENT") {
        this.refreshTokens = new Map();
      } else {
        throw error;
      }
    }
  }

  async loadResetTokens() {
    try {
      const data = await fs.readFile(this.resetTokensFile, "utf-8");
      const tokens = JSON.parse(data);
      this.resetTokens = new Map(Object.entries(tokens));
      // Clean expired tokens
      const now = Date.now();
      for (const [token, data] of this.resetTokens.entries()) {
        if (now > data.expiresAt) {
          this.resetTokens.delete(token);
        }
      }
      console.log(`🔐 Loaded ${this.resetTokens.size} reset tokens`);
    } catch (error) {
      if (error.code === "ENOENT") {
        this.resetTokens = new Map();
      } else {
        throw error;
      }
    }
  }

  async saveUsers() {
    const data = Object.fromEntries(this.users);
    await fs.writeFile(this.usersFile, JSON.stringify(data, null, 2));
  }

  async saveRefreshTokens() {
    const data = Object.fromEntries(this.refreshTokens);
    await fs.writeFile(this.refreshTokensFile, JSON.stringify(data, null, 2));
  }

  async saveResetTokens() {
    const data = Object.fromEntries(this.resetTokens);
    await fs.writeFile(this.resetTokensFile, JSON.stringify(data, null, 2));
  }

  // User operations
  async createUser(user) {
    this.users.set(user.id, user);
    await this.saveUsers();
    return user;
  }

  async getUserById(id) {
    return this.users.get(id);
  }

  async getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    await this.saveUsers();
    return updated;
  }

  async deleteUser(id) {
    const deleted = this.users.delete(id);
    if (deleted) await this.saveUsers();
    return deleted;
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  // Refresh token operations
  async createRefreshToken(tokenId, data) {
    this.refreshTokens.set(tokenId, data);
    await this.saveRefreshTokens();
  }

  async getRefreshToken(tokenId) {
    return this.refreshTokens.get(tokenId);
  }

  async deleteRefreshToken(tokenId) {
    const deleted = this.refreshTokens.delete(tokenId);
    if (deleted) await this.saveRefreshTokens();
    return deleted;
  }

  // Reset token operations
  async createResetToken(token, data) {
    this.resetTokens.set(token, data);
    await this.saveResetTokens();
  }

  async getResetToken(token) {
    return this.resetTokens.get(token);
  }

  async deleteResetToken(token) {
    const deleted = this.resetTokens.delete(token);
    if (deleted) await this.saveResetTokens();
    return deleted;
  }
}

export const storage = new Storage();
