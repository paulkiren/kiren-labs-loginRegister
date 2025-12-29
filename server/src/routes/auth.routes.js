import express from "express";
import { authController } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordResetConfirm,
} from "../middleware/validate.js";

const router = express.Router();

// Public routes
router.post("/register", validateRegistration, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post(
  "/password-reset/request",
  validatePasswordReset,
  authController.requestPasswordReset
);
router.post(
  "/password-reset/confirm",
  validatePasswordResetConfirm,
  authController.resetPassword
);

// Protected routes
router.get("/me", authenticate, authController.me);

export default router;
