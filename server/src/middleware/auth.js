import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { UnauthorizedError } from "../utils/errors.js";
import { storage } from "../services/storage.js";

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = auth.slice(7);

    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const userId = payload.sub;

      const user = await storage.getUserById(userId);
      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      req.user = user;
      req.userId = userId;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedError("Token expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedError("Invalid token");
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}
