import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password, salt) {
  const actualSalt = salt || randomBytes(16).toString("hex");
  const derived = scryptSync(String(password), actualSalt, 64);
  return { salt: actualSalt, hash: derived.toString("hex") };
}

export function verifyPassword(password, hash, salt) {
  const { hash: computedHash } = hashPassword(password, salt);
  return constantTimeCompare(computedHash, hash);
}

export function hashToken(token, salt = "token-salt") {
  return scryptSync(String(token), salt, 64).toString("hex");
}

export function constantTimeCompare(a, b) {
  try {
    const aa = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (aa.length !== bb.length) return false;
    return timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

export function generateToken(length = 48) {
  return randomBytes(length).toString("hex");
}
