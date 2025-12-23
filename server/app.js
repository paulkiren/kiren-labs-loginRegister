import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ACCESS_EXP = "15m"; // access token expiry
const REFRESH_EXP_SECONDS = 60 * 60 * 24 * 7; // 7 days

const users = new Map(); // id -> { id, name, email, passwordHash, salt, createdAt }
const refreshTokens = new Map(); // tokenId -> { userId, tokenHash, expiresAt }

function hashPassword(password, salt) {
  const actualSalt = salt || randomBytes(16).toString("hex");
  const derived = scryptSync(String(password), actualSalt, 64);
  return { salt: actualSalt, hash: derived.toString("hex") };
}

function toPublic(u) {
  return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt };
}

function constantTimeCompare(a, b) {
  try {
    const aa = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (aa.length !== bb.length) return false;
    return timingSafeEqual(aa, bb);
  } catch (e) {
    return false;
  }
}

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "name, email and password required" });
  const emailNorm = String(email).trim().toLowerCase();
  for (const u of users.values()) if (u.email === emailNorm) return res.status(409).json({ error: "email already registered" });

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const { salt, hash } = hashPassword(password);
  const stored = { id, name: String(name).trim(), email: emailNorm, passwordHash: hash, salt, createdAt };
  users.set(id, stored);
  return res.status(201).json({ user: toPublic(stored) });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const emailNorm = String(email).trim().toLowerCase();
  let found = null;
  for (const u of users.values()) if (u.email === emailNorm) { found = u; break; }
  if (!found) return res.status(401).json({ error: "invalid credentials" });

  const { hash } = hashPassword(password, found.salt);
  if (!constantTimeCompare(hash, found.passwordHash)) return res.status(401).json({ error: "invalid credentials" });

  const accessToken = jwt.sign({ sub: found.id }, JWT_SECRET, { expiresIn: ACCESS_EXP });

  // refresh token: store a random token id and hashed token value
  const tokenId = randomUUID();
  const tokenValue = randomBytes(48).toString("hex");
  const tokenHash = scryptSync(tokenValue, "refresh-token-salt", 64).toString("hex");
  const expiresAt = Date.now() + REFRESH_EXP_SECONDS * 1000;
  refreshTokens.set(tokenId, { userId: found.id, tokenHash, expiresAt });

  return res.json({ accessToken, refresh: { tokenId, token: tokenValue, expiresAt } });
});

app.post("/api/refresh", (req, res) => {
  const { tokenId, token } = req.body || {};
  if (!tokenId || !token) return res.status(400).json({ error: "tokenId and token required" });
  const record = refreshTokens.get(tokenId);
  if (!record) return res.status(401).json({ error: "invalid refresh" });
  if (Date.now() > record.expiresAt) { refreshTokens.delete(tokenId); return res.status(401).json({ error: "refresh expired" }); }

  const presented = scryptSync(String(token), "refresh-token-salt", 64).toString("hex");
  if (!constantTimeCompare(presented, record.tokenHash)) return res.status(401).json({ error: "invalid refresh" });

  const accessToken = jwt.sign({ sub: record.userId }, JWT_SECRET, { expiresIn: ACCESS_EXP });
  return res.json({ accessToken });
});

app.post("/api/logout", (req, res) => {
  const { tokenId } = req.body || {};
  if (!tokenId) return res.status(400).json({ error: "tokenId required" });
  refreshTokens.delete(tokenId);
  return res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "missing token" });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.sub;
    const u = users.get(userId);
    if (!u) return res.status(404).json({ error: "user not found" });
    return res.json({ user: toPublic(u) });
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
});

app.get("/", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
