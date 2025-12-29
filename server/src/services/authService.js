import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { config } from "../config/index.js";
import { storage } from "./storage.js";
import { User } from "../models/User.js";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateToken,
} from "../utils/crypto.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/errors.js";

export const authService = {
  async register({ name, email, password }) {
    // Check if user exists
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    // Hash password
    const { salt, hash } = hashPassword(password);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash: hash,
      salt,
    });

    await storage.createUser(user);

    return user.toPublic();
  },

  async login({ email, password }) {
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate access token
    const accessToken = jwt.sign({ sub: user.id }, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry,
    });

    // Generate refresh token
    const tokenId = randomUUID();
    const tokenValue = generateToken();
    const tokenHash = hashToken(tokenValue, "refresh-token-salt");
    const expiresAt = Date.now() + config.refreshTokenExpirySeconds * 1000;

    await storage.createRefreshToken(tokenId, {
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      user: user.toPublic ? user.toPublic() : User.fromData(user).toPublic(),
      accessToken,
      refresh: {
        tokenId,
        token: tokenValue,
        expiresAt,
      },
    };
  },

  async refreshAccessToken({ tokenId, token }) {
    const record = await storage.getRefreshToken(tokenId);
    if (!record) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      await storage.deleteRefreshToken(tokenId);
      throw new UnauthorizedError("Refresh token expired");
    }

    // Verify token
    const presentedHash = hashToken(token, "refresh-token-salt");
    const isValid = presentedHash === record.tokenHash;
    if (!isValid) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Generate new access token
    const accessToken = jwt.sign({ sub: record.userId }, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry,
    });

    return { accessToken };
  },

  async logout({ tokenId }) {
    await storage.deleteRefreshToken(tokenId);
    return { ok: true };
  },

  async requestPasswordReset({ email }) {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: "If the email exists, a reset link has been sent" };
    }

    // Generate reset token
    const resetToken = generateToken(32);
    const tokenHash = hashToken(resetToken, "reset-token-salt");
    const expiresAt = Date.now() + config.resetTokenExpiryMinutes * 60 * 1000;

    await storage.createResetToken(tokenHash, {
      userId: user.id,
      email: user.email,
      expiresAt,
    });

    // TODO: In production, send email here
    console.log(`🔐 Password reset token for ${email}: ${resetToken}`);
    console.log(`   (expires in ${config.resetTokenExpiryMinutes} minutes)`);

    return {
      message: "If the email exists, a reset link has been sent",
      // In dev mode, return the token for testing
      ...(config.nodeEnv === "development" && { resetToken }),
    };
  },

  async resetPassword({ token, newPassword }) {
    const tokenHash = hashToken(token, "reset-token-salt");
    const record = await storage.getResetToken(tokenHash);

    if (!record) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      await storage.deleteResetToken(tokenHash);
      throw new UnauthorizedError("Reset token expired");
    }

    // Get user
    const user = await storage.getUserById(record.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Hash new password
    const { salt, hash } = hashPassword(newPassword);

    // Update user
    await storage.updateUser(user.id, {
      passwordHash: hash,
      salt,
      updatedAt: new Date().toISOString(),
    });

    // Delete reset token
    await storage.deleteResetToken(tokenHash);

    return { message: "Password reset successful" };
  },
};
