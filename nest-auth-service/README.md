# Nest Auth Service

A lightweight NestJS auth service with pluggable user storage. You can run it with TypeORM (Postgres/SQLite) or a JSON file, switchable via environment variables.

## Quick start
- Install deps:
```
npm install
```
- Run with TypeORM (default):
```
npm run start:dev
```
- Run with JSON store:
```
USER_STORE=json npm run start:dev
```

## Configuration
- DB_TYPE and DB_URL configure TypeORM (e.g., postgres/sqlite:auth.db). See parseDb in [src/app.module.ts](src/app.module.ts).
- USER_STORE controls user repository implementation: set to json to use [data/users.json](data/users.json); any other value uses TypeORM.

## Storage implementations
- Repository contract lives in [src/users/users.repository.ts](src/users/users.repository.ts) with the USERS_REPOSITORY token.
- TypeORM-backed repo: [src/users/typeorm-users.repository.ts](src/users/typeorm-users.repository.ts) and entity [src/users/user.entity.ts](src/users/user.entity.ts).
- JSON-backed repo: [src/users/json-users.repository.ts](src/users/json-users.repository.ts) writing to [data/users.json](data/users.json).
- Wiring and selection happen in [src/users/users.module.ts](src/users/users.module.ts); it picks JSON when USER_STORE=json, else TypeORM.
- UsersService consumes the abstraction in [src/users/users.service.ts](src/users/users.service.ts).

## Request validation
- DTOs use class-validator decorators, e.g., [src/auth/dto/login.dto.ts](src/auth/dto/login.dto.ts). Ensure ValidationPipe is enabled in the bootstrap (see main.ts).

## Step-by-step implementation walkthrough
1) Define a storage abstraction: add the repository interface and token in [src/users/users.repository.ts](src/users/users.repository.ts).
2) Implement concrete stores:
   - TypeORM repository in [src/users/typeorm-users.repository.ts](src/users/typeorm-users.repository.ts).
   - JSON repository in [src/users/json-users.repository.ts](src/users/json-users.repository.ts) that reads/writes data/users.json atomically.
3) Inject via factory: update [src/users/users.module.ts](src/users/users.module.ts) to provide both repos and select one based on USER_STORE/DB_TYPE env.
4) Consume the abstraction: update [src/users/users.service.ts](src/users/users.service.ts) to inject USERS_REPOSITORY and call create/find methods.
5) Keep DB bootstrapping available: [src/app.module.ts](src/app.module.ts) still configures TypeORM so the TypeORM path works when selected.
6) Seed JSON store: create [data/users.json](data/users.json) initialized to [] for the JSON mode.

## Scripts
- Build: npm run build
- Dev server: npm run start:dev
- Lint/test: add or adjust scripts as needed (none configured by default here).

## Notes
- JSON mode is for development and small datasets; it reads/writes the whole file per request. For heavier use, keep TypeORM or adopt a more robust file adapter with locking.
- If you drop TypeORM entirely, remove @nestjs/typeorm and typeorm from dependencies and simplify app.module.ts and users.module.ts accordingly.