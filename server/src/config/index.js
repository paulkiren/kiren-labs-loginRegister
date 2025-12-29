import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  accessTokenExpiry: "15m",
  refreshTokenExpirySeconds: 60 * 60 * 24 * 7, // 7 days
  resetTokenExpiryMinutes: 30,
  dataDir: process.env.DATA_DIR || "./data",
  nodeEnv: process.env.NODE_ENV || "development",
};
