## 10-Day Plan (v2): Login/Register in Multiple Architectures (NestJS + TS)
Audience: build the same app in parallel across Clean Monolith, Microservices, Serverless (AWS), Event-Driven, DDD + Hexagonal/Ports & Adapters.
Tech: TypeScript/NestJS, PostgreSQL (monolith/microservices), AWS (API Gateway + Lambda), JWT RS256 with refresh rotation.

### Guardrails (to keep comparisons fair)
- One canonical domain model and one canonical OpenAPI: every architecture must implement the same endpoints, schemas, and error codes.
- Token semantics must match across tracks: access TTL, refresh rotation rules, and logout behavior are identical.
- Keep user-facing flows synchronous; use events only for non-critical side effects (audit/email/analytics).

### Domain Boundaries (DDD-lite, consistent across tracks)
- Bounded Context: Identity
  - Responsibilities: credentials, login, token issuance/rotation, password reset.
  - Aggregates: UserCredentials, Session (refresh chain).
- Bounded Context: UserProfile
  - Responsibilities: profile fields (name), CRUD, user lifecycle.
  - Aggregate: UserProfile.
- Events (shared contract): UserRegistered, PasswordResetRequested, PasswordResetCompleted, RefreshTokenRotated, RefreshTokenReuseDetected, UserDeleted.

### Repo Layout (monorepo)
- apps/
  - monolith-api (NestJS Clean Monolith, Hexagonal)
  - gateway (API Gateway/BFF for microservices)
  - auth-service (NestJS microservice, Identity context)
  - user-service (NestJS microservice, UserProfile context)
  - serverless (Lambda handlers or NestJS lambda adapter)
- packages/
  - shared (DTOs/types, validation, errors, event contracts)
  - config (env loader, schema validation)
  - jwks (key generation/rotation helpers + JWKS types)
- infra/
  - docker (docker-compose for monolith + microservices)
  - cdk or terraform (AWS infra)
- docs/ (plan, openapi, security, runbooks)
- tests/ (e2e/contract/perf)

### OpenAPI Surface (canonical; shared across tracks)
Rule: treat this as the contract of truth. Any deviation must be intentional and documented.
- SecuritySchemes:
  - bearerAuth: JWT RS256 access token
  - refreshToken: choose one primary delivery method and keep consistent (recommended: httpOnly cookie for web; mobile uses body + secure storage but same endpoint)
  - apiKey/internalAuth: gateway→services internal auth (microservices)
- Paths (core):
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
  - GET /auth/me
  - POST /auth/password-reset/request
  - POST /auth/password-reset/confirm
  - GET /users
  - GET /users/{id}
  - PATCH /users/{id}
  - DELETE /users/{id}
  - GET /health (per service)
- Schemas:
  - UserPublic {id, email, name, createdAt}
  - RegisterRequest {email, password, name}
  - LoginRequest {email, password}
  - LoginResponse {accessToken, refreshToken?, expiresIn, tokenType}
  - RefreshResponse {accessToken, refreshToken?}
  - ErrorResponse {message, code, traceId}
  - PasswordResetRequest {email}
  - PasswordResetConfirm {token, password}

### Security Checklist (RS256 + Refresh Rotation)
- Keys/JWKS
  - RS256 keypair per environment; expose JWKS with `kid`.
  - Rotation policy: new `kid` on schedule; keep old keys valid for token TTL; JWKS cache TTL documented.
  - Validation: consumers verify `iss`, `aud`, `kid`, `alg=RS256`.
- Tokens
  - Access tokens short-lived (≤15m).
  - Refresh tokens: opaque random, stored hashed+salted; include session metadata (deviceId/fingerprint, createdAt, lastUsedAt).
  - Rotation: rotate on every refresh; atomically revoke old token; reuse detection triggers session revocation and audit event.
  - Logout: revoke current refresh chain/session.
- Passwords & reset
  - Hash passwords with argon2id (preferred) or bcrypt.
  - Password reset tokens stored hashed; single-use; expire quickly.
- Abuse prevention
  - Rate limit login/refresh/password reset; protect from enumeration with uniform errors.
  - Audit logs for auth events; traceId in responses.
- Transport & headers
  - HTTPS everywhere; HSTS; security headers; strict CORS allowlist; remove x-powered-by.
- Secrets
  - Local dev `.env`; AWS uses SSM/Secrets Manager; protect private keys; least-privilege IAM.
- Service-to-service auth
  - Gateway→services signed token or mTLS; limit network exposure.

### Comparison Matrix (qualitative)
- Clean Monolith
  - Performance: low-latency, single hop
  - Complexity: low
  - Cost: low
  - Ops/debugging: easiest
  - Scaling model: scale one service
- Microservices
  - Performance: medium (extra hops)
  - Complexity: high (contracts, network, deployments)
  - Cost: higher (multiple services)
  - Ops/debugging: harder (distributed tracing needed)
  - Scaling model: scale per service
- Serverless
  - Performance: variable (cold starts + external DB)
  - Complexity: medium (IaC + service limits)
  - Cost: pay-per-use; best at spiky/low load
  - Ops/debugging: medium-hard (distributed logs)
  - Scaling model: automatic
- Event-Driven (overlay)
  - Performance: async/eventual for side effects
  - Complexity: high (idempotency, retries, DLQ)
  - Cost: broker-dependent
  - Ops/debugging: harder (message tracing)

### Starter Scaffolding Commands
- Monolith (Nest):
  - npx @nestjs/cli new monolith-api --package-manager npm --strict
- Microservices:
  - npx @nestjs/cli new gateway && npx @nestjs/cli new auth-service && npx @nestjs/cli new user-service
  - Add npm workspaces in root `package.json` (apps/*, packages/*)
- Serverless (choose one approach):
  - Nest adapter: npx @nestjs/cli new serverless
  - Function-per-file: serverless create --template aws-nodejs-typescript
- Docker baseline (to be authored):
  - postgres + monolith-api (dev)
  - gateway/auth/user services (microservices profile)

### 10-Day Daily Tasks & Deliverables (with Definition of Done)
- Day 1: Plan & workspace
  - Decide:
    - Serverless DB strategy: (A) Aurora Serverless v2 + RDS Proxy (SQL parity) OR (B) DynamoDB (cloud-native)
    - IaC tool: CDK or Terraform or Serverless Framework
    - Event bus: SNS/SQS (recommended) vs Kafka/Kinesis
    - Refresh delivery: cookie-first vs body-first (document mobile/web handling)
  - Create monorepo skeleton (apps/, packages/, infra/, docs/); root workspaces; base TS config; ESLint/Prettier; editor settings.
  - Write canonical OpenAPI doc and make it “source of truth”; add docs/security.md with JWKS + rotation policy.
  - Definition of Done: repo boots lint/typecheck; docs exist; OpenAPI contract agreed.
- Day 2: Monolith scaffold (Hexagonal)
  - Nest monolith module boundaries aligned to DDD contexts; ports/adapters boundaries explicit.
  - Postgres schema + migrations for users, refresh_tokens/sessions, password_resets.
  - Implement RS256 signing + JWKS endpoint; implement refresh rotation storage model.
  - Definition of Done: `docker-compose up` starts Postgres + API; health endpoint works; JWKS exposed.
- Day 3: Monolith endpoints + tests
  - Implement auth endpoints + user CRUD; DTO validation + guards.
  - Swagger/OpenAPI generation must match canonical spec.
  - Add e2e tests:
    - happy path register/login/me
    - refresh rotation success
    - refresh token reuse detection (refresh twice with same token => reject + revoke session)
  - Definition of Done: e2e green; Swagger UI matches contract.
- Day 4: Microservices design & scaffold (contracts-first)
  - Formalize boundaries: auth-service (Identity), user-service (UserProfile), gateway (HTTP façade).
  - Add shared contract package and contract tests (OpenAPI/schema snapshot).
  - Gateway validates JWT via JWKS (cache policy documented).
  - Definition of Done: services run; gateway routes health; contract snapshot in CI.
- Day 5: Microservices auth implementation
  - Auth-service implements all auth endpoints; JWKS; refresh rotation; emits events.
  - Gateway routes auth endpoints; adds rate limiting; internal auth between gateway and services.
  - Definition of Done: contract tests + minimal e2e through gateway pass.
- Day 6: Microservices user implementation
  - User-service user CRUD; consumes UserRegistered; handles deletes.
  - Add tracing correlation IDs across gateway/auth/user.
  - Definition of Done: end-to-end via gateway (register→profile fetch/update) passes.
- Day 7: Serverless track scaffold
  - Implement endpoints as Lambda handlers behind API Gateway HTTP API.
  - RS256 key management: prefer KMS-managed key or Secrets Manager; JWKS served/cached.
  - DB per Day 1 choice:
    - Aurora: RDS Proxy + migrations approach
    - DynamoDB: single-table design for users + sessions + reset tokens
  - Definition of Done: deployable stack synths; local run path documented.
- Day 8: Event-driven enhancements (side effects)
  - Add SNS/SQS (or chosen broker); publish events; consumers for audit/email.
  - Add idempotency keys; DLQ; retry policy.
  - Definition of Done: publish/consume path verified; DLQ test works.
- Day 9: Cross-cutting concerns & CI
  - Observability: structured logs, OpenTelemetry tracing, metrics; request IDs.
  - Security hardening: headers, CORS, rate limits per architecture.
  - CI: lint, test, build, docker build, contract snapshot.
  - Definition of Done: CI green; tracing works locally for monolith/microservices.
- Day 10: Hardening, perf, docs
  - Performance smoke tests (k6/Artillery) across tracks; compare p95 latency.
  - Cost/complexity notes updated with real measurements and infra footprints.
  - Definition of Done: final docs + matrix; ready for review.

### Day 1 Starter Code (to generate next)
- Root workspaces + base tooling.
- apps/monolith-api: minimal Nest app with HealthController, ConfigModule, and placeholder Auth/User modules.
- infra/docker: docker-compose.dev.yml for Postgres + monolith-api (hot reload).

### Notes: Serverless DB Choice
- Aurora Serverless v2 + RDS Proxy: best parity with Postgres monolith/microservices; simpler domain reuse.
- DynamoDB: simpler ops/cost; requires persistence model redesign and careful query/index planning.

### Notes: Event Bus Choice
- SNS/SQS: simplest AWS-native fanout + queue processing with DLQ.
- Kafka/Kinesis: only if ordering/high throughput requirements justify extra ops.
