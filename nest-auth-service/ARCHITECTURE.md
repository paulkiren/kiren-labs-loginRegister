# Architecture Overview

This service is a small NestJS app focused on authentication with a pluggable user store. It keeps a clean separation between HTTP layer, application services, and persistence through a repository abstraction.

## Modules and layers
- AppModule: boots core modules (UsersModule, AuthModule) and, when enabled, TypeORM connection setup.
- UsersModule: provides UsersService, controller, and a repository binding that selects either TypeORM or JSON implementation based on env.
- AuthModule: handles auth flows (JWT/passport wiring; see auth folder).
- Common/util: helpers like password hashing.

## Repository abstraction
- Contract: defined in src/users/users.repository.ts with USERS_REPOSITORY token.
- Implementations:
  - TypeORM: src/users/typeorm-users.repository.ts using User entity from src/users/user.entity.ts.
  - JSON file: src/users/json-users.repository.ts persisting to data/users.json with simple atomic write (temp file + rename).
- Selection: src/users/users.module.ts chooses the implementation via env (`USER_STORE=json` picks JSON; otherwise TypeORM).

## Data storage paths
- TypeORM: configured via DB_TYPE and DB_URL in src/app.module.ts (supports postgres, sqlite default).
- JSON: data/users.json relative to project root; created automatically if missing.

## Request/response flow
1) HTTP request enters controller (UsersController/AuthController).
2) DTOs validate input using class-validator (e.g., login and register DTOs).
3) UsersService handles use cases and delegates persistence to USERS_REPOSITORY without knowing which backend is active.
4) Responses bubble back through controllers; errors (e.g., conflicts) surface as HTTP exceptions.

## Environment switches
- USER_STORE: json | typeorm (default). Controls which repository implementation is injected.
- DB_TYPE / DB_URL: used when TypeORM path is active. DB_TYPE defaults to sqlite; DB_URL defaults to sqlite:auth.db.

## Build/run
- Dev: npm run start:dev (set USER_STORE=json to enable file store).
- Build: npm run build; start compiled output with npm start.

## Extending
- Add new persistence: implement UsersRepository, provide it in UsersModule, and adjust the factory to select it via env.
- Add features: create new DTOs/controllers/services; reuse repository contract for persistence.
- Hardening JSON mode: add locking/mutex or switch to a library (e.g., lowdb or write-file-atomic) if you expect concurrent writes.