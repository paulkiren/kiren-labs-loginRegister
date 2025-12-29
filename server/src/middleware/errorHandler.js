import { AppError } from "../utils/errors.js";
import { config } from "../config/index.js";

export function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    // Operational errors (expected)
    return res.status(err.statusCode).json({
      error: err.message,
      ...(config.nodeEnv === "development" && { stack: err.stack }),
    });
  }

  // Programming errors or unknown errors
  console.error("❌ Unexpected Error:", err);

  return res.status(500).json({
    error: "Internal server error",
    ...(config.nodeEnv === "development" && {
      message: err.message,
      stack: err.stack,
    }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found" });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
