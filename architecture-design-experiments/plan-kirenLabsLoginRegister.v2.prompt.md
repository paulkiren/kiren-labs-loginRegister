## 10-Day Plan (v3): Login/Register Across Architectures (NestJS + TS)
Audience: deliver one canonical login/register domain across multiple architectures, with identical contract and token semantics.
Tech: TypeScript/NestJS, Postgres (monolith/microservices), AWS (API Gateway + Lambda), RS256 access JWT + opaque refresh with rotation.

### Decisions to Lock on Day 1
- Serverless DB: Aurora Serverless v2 + RDS Proxy (preferred for SQL parity) OR DynamoDB (single-table redesign). Pick one.
- IaC: CDK or Terraform (or Serverless Framework if DynamoDB-first). Pick one.
- Event bus: SNS/SQS (default) OR Kafka/Kinesis if ordering/throughput demands.
- Refresh delivery: web uses secure httpOnly cookie (SameSite=Lax/Strict in prod), mobile posts refresh in body and stores securely. Same endpoint behavior.
- Key custody: RSA keys per env; storage in AWS KMS/Secrets Manager (or local files in dev) with rotation schedule and cache TTL documented.

### Domain and Contract (Canonical, Single Source)
- Bounded Contexts: Identity (credentials, tokens, password reset), UserProfile (name CRUD, lifecycle).
- Events: UserRegistered, PasswordResetRequested, PasswordResetCompleted, RefreshTokenRotated, RefreshTokenReuseDetected, UserDeleted.
- OpenAPI (docs/openapi.yaml) is the source of truth; contract tests compare implementations to it.
- SecuritySchemes: bearerAuth (RS256 access JWT), refreshToken, internalAuth (gateway→services token or mTLS).
- Paths: POST /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/password-reset/request, /auth/password-reset/confirm; GET /auth/me; GET /users, /users/{id}; PATCH /users/{id}; DELETE /users/{id}; GET /health (per service).
- Schemas: UserPublic {id, email, name, createdAt}; RegisterRequest; LoginRequest; LoginResponse {accessToken, refreshToken?, expiresIn, tokenType}; RefreshResponse {accessToken, refreshToken?}; PasswordResetRequest; PasswordResetConfirm; ErrorResponse {message, code, traceId}.

### Security and Token Semantics (Must Match Everywhere)
- Access JWT: RS256, ≤15m TTL, claims: sub, iat, exp, iss, aud, kid.
- Refresh: opaque random, hashed+salted; stored with session metadata (sessionId/chainId, deviceId or fingerprint, createdAt, lastUsedAt, expiresAt, revokedAt, reuseDetectedAt). Rotate on every refresh; reuse detection revokes the chain and emits event.
- Logout: revoke current session/chain and dependent refresh tokens.
- JWKS: expose /jwks with kid; cache TTL defined; keep prior keys valid for overlap window; document rollback.
- Passwords: argon2id (preferred) or bcrypt; resets use hashed, single-use tokens with short TTL.
- Abuse controls: rate limit login/refresh/reset; uniform errors to prevent enumeration; audit log auth events; include traceId.
- Transport/headers: HTTPS, HSTS, CORS allowlist, no x-powered-by, security headers (CSP where viable).

### Repository Layout (Monorepo)
- apps/
  - monolith-api (NestJS, hexagonal/ports)
  - gateway (HTTP BFF for services)
  - auth-service (Identity)
  - user-service (UserProfile)
  - serverless (lambdas or Nest lambda adapter)
- packages/
  - shared (DTOs/types/errors/events, OpenAPI typings)
  - config (env schema/loader)
  - jwks (keygen/rotation + types)
- infra/
  - docker (compose for Postgres + monolith/microservices)
  - cdk or terraform (AWS stacks)
- docs/ (openapi.yaml, security.md with JWKS/rotation, runbooks)
- tests/ (contract/e2e/perf)

### Track-Specific Notes
- Monolith (NestJS hexagonal): ports for persistence (Postgres via Prisma/TypeORM), crypto, email; adapters per port. Swagger generation must match docs/openapi.yaml.
- Microservices: gateway validates JWT via JWKS (cached); internal auth via signed token or mTLS; shared package for DTOs/errors/events; tracing propagated.
- Serverless: handlers per endpoint or Nest adapter; keys via KMS/Secrets Manager; JWKS cached; DB per Day 1 decision (Aurora + migrations or DynamoDB single-table with GSIs for users/sessions/resets).
- Event-driven overlay: publish non-critical side effects (audit/email). Idempotency keys, retries, DLQ.

### Testing & Quality Gates
- Contract tests: snapshot against docs/openapi.yaml for each app.
- Unit + integration for services/adapters; e2e flows: register/login/me, refresh rotation success, reuse detection failure, password reset happy/expired.
- Security tests: JWKS cache TTL, invalid kid, expired/invalid tokens, rate limit behavior.
- CI: lint, typecheck, unit/integration, contract, e2e (monolith then gateway path), docker build; optional perf smoke.

### Observability & Ops
- Structured logs with traceId/requestId; OpenTelemetry tracing; basic metrics (auth attempts, refresh rotations, reuse detections, rate-limit hits).
- Runbooks: key rotation, JWKS cache bust, refresh chain revocation, password reset handling, DB migration steps.

### 10-Day Plan (DoD = contract parity + tests green)
- Day 1: Decide serverless DB, event bus, IaC; scaffold monorepo (apps/, packages/, infra/, docs/, tests/); base TS config, ESLint/Prettier; author docs/openapi.yaml and docs/security.md (JWKS policy, rotation, cache TTL). DoD: lint/typecheck run; contract agreed.
- Day 2: Monolith scaffold (Nest) with hexagonal modules; Postgres schema + migrations for users, sessions/refresh, resets; RS256 keys + JWKS endpoint; refresh storage model. DoD: docker-compose up brings Postgres + API; /health and /jwks work.
- Day 3: Monolith endpoints + guards; refresh rotation + reuse detection; Swagger aligned to openapi; e2e (register/login/me, refresh success, reuse fail). DoD: e2e green.
- Day 4: Microservices scaffold (gateway, auth-service, user-service); shared contracts package; contract tests wired; gateway JWT validation with JWKS cache policy. DoD: services start; gateway health; contract snapshot in CI.
- Day 5: Auth-service implements Identity endpoints, refresh rotation, JWKS; emits events. Gateway routes auth, adds rate limiting/internal auth. DoD: contract tests + minimal e2e through gateway pass.
- Day 6: User-service CRUD; consumes UserRegistered; handles deletes; tracing propagation across gateway/auth/user. DoD: end-to-end via gateway (register→profile fetch/update) passes.
- Day 7: Serverless scaffold; choose DB path and wire persistence; RS256 via KMS/Secrets Manager; JWKS served; handlers match contract. DoD: stack synth/deployable; local run path documented.
- Day 8: Event-driven side effects (audit/email) on chosen bus; idempotency + DLQ + retry tested. DoD: publish/consume path verified; DLQ test passes.
- Day 9: Cross-cutting hardening: security headers, CORS allowlist, rate limits; OTel tracing/metrics; CI pipeline finalized. DoD: CI green; tracing locally visible.
- Day 10: Perf smoke (k6/Artillery) on monolith + gateway; record p95; cost/complexity notes per track; finalize docs/runbooks. DoD: docs complete; perf notes captured.

### Quick Start (local dev)
- Compose profile: Postgres + monolith-api hot reload; later add gateway/auth/user services profile.
- Dev keys: generate RSA pair per env; write JWKS and private key to local secrets; set JWKS cache TTL in config.
- Env: .env.example with JWT settings, DB URLs, rate limits, CORS origins, service-to-service secret.

### Risks to Track
- Divergence from canonical OpenAPI; mitigate with contract tests.
- JWKS cache staleness after rotation; mitigate with cache TTL + bust hook.
- Refresh reuse detection bugs; cover with e2e negative tests and metrics.
- DynamoDB option requires separate modeling; if chosen, document single-table design early.
