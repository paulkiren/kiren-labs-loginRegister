import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { storage } from "./services/storage.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export async function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging in development
  if (config.nodeEnv === "development") {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // Initialize storage
  await storage.init();

  // Routes
  app.use("/api", routes);

  // Root route
  app.get("/", (req, res) => {
    res.json({
      message: "Login/Register API Server",
      version: "2.0.0",
      endpoints: {
        auth: {
          register: "POST /api/auth/register",
          login: "POST /api/auth/login",
          refresh: "POST /api/auth/refresh",
          logout: "POST /api/auth/logout",
          me: "GET /api/auth/me",
          passwordResetRequest: "POST /api/auth/password-reset/request",
          passwordResetConfirm: "POST /api/auth/password-reset/confirm",
        },
        users: {
          getAll: "GET /api/users",
          getOne: "GET /api/users/:id",
          update: "PATCH /api/users/:id",
          delete: "DELETE /api/users/:id",
        },
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
