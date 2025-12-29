## 10-Day Plan: Login/Register in Multiple Architectures (NestJS + TS)
Audience: build the same app in parallel across Clean Monolith, Microservices, Serverless (AWS), Event-Driven, DDD + Hexagonal/Ports & Adapters.
Tech: TypeScript/NestJS, PostgreSQL (monolith/microservices), AWS (API Gateway + Lambda; DB choice below), JWT RS256 with refresh rotation.

### Repo Layout (monorepo)
- apps/
  - monolith-api (NestJS Clean Monolith, Hexagonal)
  - gateway (API Gateway/BFF for microservices)
  - auth-service (NestJS microservice)
  - user-service (NestJS microservice)
  - serverless (Lambda handlers or NestJS lambda adapter)
- packages/
  - shared (DTOs/types, validation, errors)
  - config (env loader, Zod/class-validator schemas)
  - jwks (key generation/rotation helpers)
- infra/
  - docker (docker-compose for monolith + microservices)
  - cdk or terraform (AWS infra)
- docs/ (plan, openapi, security, runbooks)
- tests/ (e2e/contract/perf)

### OpenAPI Surface (shared across tracks)
- SecuritySchemes: bearerAuth (JWT RS256), refreshToken (cookie/body), apiKey (internal/gateway).
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
- Schemas: UserPublic {id, email, name, createdAt}; LoginResponse {accessToken, refreshToken, expiresIn, tokenType}; RefreshResponse {accessToken, refreshToken}; ErrorResponse {message, code, traceId}; PasswordResetRequest {email}; PasswordResetConfirm {token, password}.

### Security Checklist (RS256 + Refresh Rotation)
- RSA keypair per environment; JWKS endpoint (kid, alg RS256); cache + rotate on schedule.
- Access tokens short-lived (≤15m); refresh tokens opaque, salted+hashed in DB; bind to device + rotation counter; rotate every refresh and revoke old token atomically; detect reuse.
- Deliver refresh in httpOnly, secure, SameSite=strict cookies (web) or secure storage (mobile); optional fingerprint binding.
- Password hashing with argon2id or bcrypt; password policy; optional MFA hook.
- Input validation on all DTOs; uniform error messages to avoid enumeration.
- Rate limit auth endpoints; CAPTCHA optional; IP/device logging.
- HTTPS everywhere; HSTS; CORS allowlist; security headers; remove x-powered-by.
- Secret management via env + SSM/Secrets Manager/KMS; lock down JWT private keys.
- Audit log auth events; include traceId; minimal PII.
- Cleanup jobs for expired refresh/reset tokens; soft-delete users cascades revocation.
- Service-to-service auth (gateway→services) via signed tokens or mTLS.

### Comparison Matrix (qualitative)
- Clean Monolith: performance low-latency (single hop); complexity low; cost low; scaling vertical or single horizontal service; blast radius broad.
- Microservices: performance medium (extra hops); complexity high (contracts, discovery, CI/CD); cost higher (multiple services/net hops); scaling per service; blast radius narrower.
- Serverless: performance variable (cold starts); complexity medium (IaC, limits); cost pay-per-use (good for spiky/low load); scaling auto; ops low servers but needs good observability.
- Event-Driven: performance async/eventual; complexity high (idempotency, ordering, DLQs); cost depends on broker; great decoupling/audit; latency for user flows must stay synchronous where needed.

### Starter Scaffolding Commands
- Monolith (Nest): npx @nestjs/cli new monolith-api --package-manager npm --strict
  - cd monolith-api && npm i @nestjs/config @nestjs/typeorm typeorm pg class-validator class-transformer bcrypt jsonwebtoken jose
- Microservices: npx @nestjs/cli new gateway && npx @nestjs/cli new auth-service && npx @nestjs/cli new user-service
  - Add workspaces in root package.json; npm i -w packages/shared class-validator class-transformer zod jose
- Serverless: npx @nestjs/cli new serverless && npm i @nestjs/platform-serverless aws-sdk aws-lambda @vendia/serverless-express (or go function-per-file)
  - IaC: npm create cdktf@latest or npm i -g serverless && serverless create --template aws-nodejs-typescript
- Docker baseline (to be authored): services: postgres, monolith-api (dev), gateway/auth/user (microservices profile), optional localstack for serverless emulation.

### 10-Day Daily Tasks & Deliverables
- Day 1: Plan & workspace
  - Finalize requirements; choose DB for serverless (DynamoDB vs Aurora Serverless v2 vs RDS Proxy); choose IaC tool (CDK/Terraform/Serverless Framework); choose broker (SNS/SQS vs Kafka).
  - Create monorepo skeleton folders (apps/, packages/, infra/, docs/); add root package.json workspaces; base tsconfig, eslint/prettier; .nvmrc/.editorconfig.
  - Generate RSA keys (dev) and document rotation; write docs/plan.md, docs/security.md, docs/openapi.md.
  - Deliverables: repo layout committed; docs drafted; keys in dev-only location.
- Day 2: Monolith scaffold
  - Nest new monolith-api; set up Hexagonal structure (modules auth, users, health; domain/services/adapters).
  - Wire Postgres via TypeORM or Prisma; define schema (users, refresh_tokens, password_resets); add migrations; env config.
  - Implement JWT RS256 signing (dev keys); refresh token table with rotation fields; password hashing.
  - Deliverables: running monolith dev server; DB migrations; basic health endpoint.
- Day 3: Monolith APIs + docs/tests
  - Implement auth endpoints (register, login, refresh, logout, me, password reset request/confirm); user CRUD (protected).
  - Add DTO validation, guards, interceptors; Swagger/OpenAPI generation; e2e tests for auth happy paths and refresh rotation.
  - Dockerize monolith + Postgres (docker-compose.dev.yml); seed script.
  - Deliverables: green e2e, Swagger UI, compose up.
- Day 4: Microservices design & scaffold
  - Define service boundaries: auth-service (tokens), user-service (profiles), gateway (HTTP façade/aggregation); decide comms (HTTP or Nest TCP) + event bus.
  - Scaffold Nest apps; set up shared package for DTOs/schemas; gateway JWT validation against auth JWKS.
  - Deliverables: services build+lint; health checks; shared types published.
- Day 5: Microservices auth implementation
  - Auth-service: register/login/refresh/logout/password reset; RS256 keys + JWKS; refresh rotation in Postgres; events emitted (UserRegistered, TokenRotated).
  - Gateway routes auth endpoints to auth-service; service-to-service auth (signed token or mTLS); rate limiting at gateway.
  - Deliverables: contract tests gateway↔auth; compose profile for auth+db+gateway.
- Day 6: Microservices user implementation
  - User-service: user CRUD; consumes UserRegistered; exposes GET/PATCH/DELETE.
  - Gateway routes user endpoints; background worker/cron for stale token cleanup.
  - Deliverables: contract tests gateway↔user; e2e spanning gateway/auth/user.
- Day 7: Serverless track scaffold
  - Choose DB (DynamoDB or Aurora Serverless v2); design handlers: auth-register/login/refresh/logout/me, user CRUD; API Gateway HTTP API; custom domain; JWT RS256 via KMS-managed key; JWKS cache.
  - Infra as code (CDK/Terraform/Serverless Framework); local emulation via SAM/Serverless + localstack.
  - Deliverables: IaC stack synth; minimal handler returning health; lint/build pipeline.
- Day 8: Event-driven enhancements
  - Add SNS/SQS or Kafka; publish auth/user events; consumers for email/audit; DLQ + retries; idempotency keys.
  - Deliverables: event contracts in docs; simple consumer wired; tests for idempotency.
- Day 9: Cross-cutting & CI
  - Observability: structured logs, OpenTelemetry tracing, metrics; request IDs; audit logs.
  - Rate limiting, CORS/security headers, input hardening; migration scripts; CI pipelines (lint/test/build/docker) in GitHub Actions.
  - Deliverables: CI green; tracing spans visible locally; rate limits configured.
- Day 10: Hardening & docs
  - Performance smoke (k6/Artillery) across tracks; cost notes per track; runbooks; finalize OpenAPI and security docs.
  - Deliverables: comparison matrix validated; READMEs per app; Day 1 starter code + Docker compose ready for handoff.

### Day 1 Starter Code (to generate next)
- Root package.json with workspaces; tsconfig base; eslint/prettier configs.
- apps/monolith-api: Nest bootstrap with HealthController; config module loading env.
- infra/docker/docker-compose.dev.yml: postgres + monolith-api service with hot reload; volume for db.

### AWS Serverless DB Choice Notes
- DynamoDB: simple/cheap, needs token model redesign (PK: userId, SK: tokenId), eventual consistency considerations.
- Aurora Serverless v2: keeps SQL parity with monolith/microservices; cost higher; use RDS Proxy for Lambda.

### Event Bus Choice Notes
- AWS-native: SNS/SQS for fanout + queues; simplest to manage.
- Kafka/Kinesis: only if high throughput/ordering required; more ops.
