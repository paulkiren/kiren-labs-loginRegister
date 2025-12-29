import { ValidationError } from "../utils/errors.js";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateRequired,
} from "../utils/validators.js";

export function validateRegistration(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    validateRequired(["name", "email", "password"], req.body || {});

    req.validatedData = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function validateLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};

    validateRequired(["email", "password"], req.body || {});

    req.validatedData = {
      email: validateEmail(email),
      password: password, // Don't validate password format on login
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function validatePasswordReset(req, res, next) {
  try {
    const { email } = req.body || {};

    validateRequired(["email"], req.body || {});

    req.validatedData = {
      email: validateEmail(email),
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function validatePasswordResetConfirm(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};

    validateRequired(["token", "newPassword"], req.body || {});

    req.validatedData = {
      token: token,
      newPassword: validatePassword(newPassword),
    };

    next();
  } catch (error) {
    next(error);
  }
}
