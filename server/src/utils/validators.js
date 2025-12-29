import { ValidationError } from "./errors.js";

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }
  return email.trim().toLowerCase();
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }
  return password;
}

export function validateName(name) {
  if (!name || name.trim().length < 2) {
    throw new ValidationError("Name must be at least 2 characters long");
  }
  return name.trim();
}

export function validateRequired(fields, data) {
  const missing = [];
  for (const field of fields) {
    if (!data[field]) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }
}
