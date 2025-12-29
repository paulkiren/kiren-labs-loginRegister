# Security & Token Policy (Canonical)

## Keys & JWKS
- RS256 keypair per environment. Private key kept in KMS/Secrets Manager (prod/stage) or local files (dev). No sharing across environments.
- JWKS endpoint exposes public keys with `kid` and `alg=RS256`. Cache TTL: 10 minutes (tune per env). Clients must validate `kid`, `alg`, `iss`, `aud`.
- Rotation: new key on schedule (e.g., weekly). Keep prior keys available until all issued access tokens expire. Document rollback (re-add previous key to JWKS if needed).
- Cache bust: after rotation, force JWKS cache clear at gateway/services and note in runbook.

## Tokens
- Access: RS256, TTL <= 15m, claims: sub, iat, exp, iss, aud, kid. Audience = API origin; issuer = service origin.
- Refresh: opaque random; stored hashed+salted. Persist metadata: sessionId/chainId, tokenId, userId, deviceId/fingerprint (if provided), createdAt, lastUsedAt, expiresAt, revokedAt, reuseDetectedAt. No plaintext storage.
- Rotation: every refresh issues new refresh token and access token, revoking prior token. If a presented refresh is already rotated/revoked, mark reuse, revoke the chain, emit RefreshTokenReuseDetected, and block.
- Logout: revoke current session/chain and dependent refresh tokens.

## Passwords & Reset
- Hash with argon2id (preferred) or bcrypt. No plaintext logs.
- Password reset tokens are opaque, hashed at rest, single-use, short TTL (<=30m). Revoke after use/expiry.
- Responses for reset requests are non-enumerating (same message whether email exists).

## Transport, Headers, CORS
- HTTPS only; HSTS in production. Remove x-powered-by. Add security headers (CSP where feasible), and strict CORS allowlist per app.

## Abuse Prevention
- Rate limit login/refresh/reset per IP and per credential/email. Uniform error bodies to avoid user enumeration. Add jitter/backoff where appropriate.

## Observability & Audit
- Attach traceId/requestId to responses and logs. Audit auth events: register, login success/fail, refresh, reuse detected, logout, password reset request/confirm.

## Service-to-Service Auth
- Gateway -> services: signed internal token (short TTL) or mTLS. Validate audience/issuer and `kid` for internal keyset.

## Secrets
- Prod/stage: store secrets in KMS/Secrets Manager/SSM. Dev: .env (never committed). Principle of least privilege on IAM.
