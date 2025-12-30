# Testing Guide for Monolith API

This guide explains how to write and run tests for the monolith API. We've created example test files that demonstrate patterns for unit tests, integration tests, and E2E tests.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Test Structure](#test-structure)
3. [Example Test Files](#example-test-files)
4. [Writing Tests](#writing-tests)
5. [Running Tests](#running-tests)
6. [Test Patterns](#test-patterns)

---

## Getting Started

### Prerequisites
- Node.js and npm installed
- Docker installed (for test database)
- All dependencies installed (`npm install`)

### Setup

1. **Generate Test JWT Keys** (one-time setup):
```bash
cd test/fixtures
bash generate-test-keys.sh
```

2. **Start Test Database**:
```bash
cd test/scripts
bash start-test-db.sh
```

3. **Run Migrations on Test Database**:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/test_db" npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## Test Structure

```
apps/monolith-api/
├── src/
│   ├── modules/identity/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── auth.service.spec.ts           ← UNIT TEST EXAMPLE
│   │   └── identity.integration-spec.ts       ← INTEGRATION TEST EXAMPLE
│   └── infrastructure/
│       └── adapters/
│           ├── prisma-user.repository.ts
│           └── prisma-user.repository.spec.ts ← REPOSITORY TEST EXAMPLE
└── test/
    ├── e2e/auth/
    │   └── register.e2e-spec.ts               ← E2E TEST EXAMPLE
    ├── factories/        (test data factories)
    ├── mocks/           (mock utilities)
    └── helpers/         (test helpers)
```

---

## Example Test Files

We've created **4 comprehensive example test files** that demonstrate all testing patterns:

### 1. **auth.service.spec.ts** - Unit Test Example
- **Location**: `src/modules/identity/services/auth.service.spec.ts`
- **Purpose**: Demonstrates service unit testing with mocked dependencies
- **What it tests**: AuthService methods (register, login, refresh, logout, password reset)
- **Pattern**: Uses mock repositories, crypto service, and token service

**Key Takeaways**:
- Mock all dependencies using `jest-mock-extended`
- Use AAA pattern (Arrange, Act, Assert)
- Test both success and error scenarios
- Verify method calls and arguments

### 2. **prisma-user.repository.spec.ts** - Repository Test Example
- **Location**: `src/infrastructure/adapters/prisma-user.repository.spec.ts`
- **Purpose**: Demonstrates repository testing with mocked Prisma
- **What it tests**: PrismaUserRepository CRUD operations
- **Pattern**: Uses `DeepMockProxy` to mock PrismaService

**Key Takeaways**:
- Use `mockDeep<PrismaService>()` for Prisma mocking
- Test each CRUD operation independently
- Verify correct Prisma method calls

### 3. **identity.integration-spec.ts** - Integration Test Example
- **Location**: `src/modules/identity/identity.integration-spec.ts`
- **Purpose**: Demonstrates integration testing with real database
- **What it tests**: Complete authentication flows across multiple components
- **Pattern**: Uses real modules and database, with factories for test data

**Key Takeaways**:
- Import real modules (IdentityModule, PrismaModule)
- Use factories to create test data
- Clean database after each test
- Test complete workflows (register → login, token refresh, password reset)

### 4. **register.e2e-spec.ts** - E2E Test Example
- **Location**: `test/e2e/auth/register.e2e-spec.ts`
- **Purpose**: Demonstrates E2E HTTP testing
- **What it tests**: POST /auth/register endpoint
- **Pattern**: Uses Supertest to make HTTP requests to the running app

**Key Takeaways**:
- Test HTTP endpoints through the full application stack
- Use `request(app.getHttpServer())` for HTTP calls
- Test validation, error handling, and security
- Verify database state after operations

---

## Writing Tests

### How to Replicate These Patterns

#### For Service Unit Tests (like auth.service.spec.ts):

1. **Copy the structure** from `auth.service.spec.ts`
2. **Create mocks** for all dependencies
3. **For each method**, write tests for:
   - ✅ Successful execution
   - ❌ Error scenarios
   - 🔍 Edge cases

**Example - Testing TokenService**:
```typescript
describe('TokenService', () => {
  let service: TokenService;
  // ... setup mocks

  describe('signAccessToken', () => {
    it('should generate valid JWT', () => { /* test */ });
    it('should include correct claims', () => { /* test */ });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', () => { /* test */ });
    it('should reject expired token', () => { /* test */ });
    it('should reject invalid signature', () => { /* test */ });
  });
});
```

#### For Repository Unit Tests:

1. **Copy the structure** from `prisma-user.repository.spec.ts`
2. **Mock PrismaService** with `mockDeep<PrismaService>()`
3. **Test each CRUD operation**

**Example - Testing RefreshSessionRepository**:
```typescript
describe('PrismaRefreshSessionRepository', () => {
  let repository: PrismaRefreshSessionRepository;
  let prisma: DeepMockProxy<PrismaService>;

  // ... setup

  describe('create', () => {
    it('should create a session', async () => {
      const data = { userId: 'user-1', tokenHash: 'hash', expiresAt: new Date() };
      prisma.refreshSession.create.mockResolvedValue({ id: 'session-1', ...data });

      const result = await repository.create(data);

      expect(result.id).toBe('session-1');
    });
  });

  // ... more tests
});
```

#### For Integration Tests:

1. **Copy the structure** from `identity.integration-spec.ts`
2. **Import real modules** that you want to test together
3. **Use factories** to create test data
4. **Test complete workflows**

**Example - Testing User Profile Module Integration**:
```typescript
describe('User Profile Module Integration', () => {
  let module: TestingModule;
  let profileService: ProfileService;
  let prisma: PrismaService;
  let userFactory: UserFactory;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, PrismaModule, ProfileModule],
    }).compile();
    // ... setup
  });

  describe('Profile Update Flow', () => {
    it('should update user profile', async () => {
      const user = await userFactory.create();

      const result = await profileService.updateProfile(user.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      // Verify in database
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser?.name).toBe('Updated Name');
    });
  });
});
```

#### For E2E Tests:

1. **Copy the structure** from `register.e2e-spec.ts`
2. **Test HTTP endpoints** using Supertest
3. **Organize by scenarios**: successful, validation errors, edge cases, security

**Example - Testing Login E2E**:
```typescript
describe('POST /auth/login (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // ... setup

  describe('successful login', () => {
    it('should login with valid credentials', async () => {
      // Arrange - create user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'Pass123!', name: 'Test' });

      // Act - login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Pass123!' })
        .expect(200);

      // Assert
      expect(response.body.accessToken).toBeDefined();
    });
  });

  describe('validation errors', () => {
    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPass' })
        .expect(401);
    });
  });
});
```

---

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests Only
```bash
npm run test:e2e
```

### With Coverage
```bash
npm run test:cov
```

### Watch Mode
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test auth.service.spec.ts
```

---

## Test Patterns

### AAA Pattern (Arrange, Act, Assert)

Always structure tests using AAA:

```typescript
it('should do something', async () => {
  // Arrange - Setup test data and mocks
  const input = { email: 'test@example.com' };
  mockService.someMethod.mockResolvedValue(expectedValue);

  // Act - Execute the code being tested
  const result = await service.methodUnderTest(input);

  // Assert - Verify the outcome
  expect(result).toEqual(expectedValue);
  expect(mockService.someMethod).toHaveBeenCalledWith(input);
});
```

### Database Cleanup

**Integration & E2E tests** must clean the database:

```typescript
afterEach(async () => {
  // Order matters! Respect foreign key constraints
  await prisma.passwordReset.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
});
```

### Using Factories

Create test data with factories for consistency:

```typescript
// Instead of this:
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: await argon2.hash('password'),
  },
});

// Do this:
const user = await userFactory.create({
  email: 'test@example.com',
});
```

### Mocking Best Practices

**Unit Tests - Mock everything external:**
```typescript
const mockRepo = createMockUserRepository();
mockRepo.findByEmail.mockResolvedValue(user);
mockRepo.create.mockResolvedValue(newUser);
```

**Integration Tests - Use real implementations:**
```typescript
// Import real modules, use real database
const module = await Test.createTestingModule({
  imports: [PrismaModule, IdentityModule],
}).compile();
```

**E2E Tests - Test the full stack:**
```typescript
// No mocking - test through HTTP
const response = await request(app.getHttpServer())
  .post('/auth/register')
  .send(dto);
```

---

## Remaining Tests to Implement

Based on the plan, here are the tests you should create by replicating the example patterns:

### Unit Tests (~50 more tests needed)
- [ ] `token.service.spec.ts` (5 tests) - Follow auth.service.spec.ts pattern
- [ ] `jwks.service.spec.ts` (3 tests) - Follow auth.service.spec.ts pattern
- [ ] `prisma-refresh-session.repository.spec.ts` (7 tests) - Follow prisma-user.repository.spec.ts pattern
- [ ] `prisma-password-reset.repository.spec.ts` (7 tests) - Follow prisma-user.repository.spec.ts pattern
- [ ] `node-crypto.service.spec.ts` (5 tests) - Follow auth.service.spec.ts pattern
- [ ] `jwt-auth.guard.spec.ts` (3 tests) - Test canActivate method
- [ ] `current-user.decorator.spec.ts` (2 tests) - Test decorator extraction

### Integration Tests (~10 more tests needed)
- [ ] `refresh-flow.integration-spec.ts` (5-7 tests) - Follow identity.integration-spec.ts pattern

### E2E Tests (~23 more tests needed)
- [ ] `test/e2e/auth/login.e2e-spec.ts` (4 tests) - Follow register.e2e-spec.ts pattern
- [ ] `test/e2e/auth/refresh.e2e-spec.ts` (5 tests)
- [ ] `test/e2e/auth/logout.e2e-spec.ts` (2 tests)
- [ ] `test/e2e/auth/password-reset.e2e-spec.ts` (6 tests)
- [ ] `test/e2e/auth/protected-routes.e2e-spec.ts` (4 tests)
- [ ] `test/e2e/auth/jwks.e2e-spec.ts` (2 tests)

---

## Troubleshooting

### Test database connection errors
```bash
# Ensure test database is running
docker ps | grep test-db

# Restart test database
cd test/scripts
bash stop-test-db.sh
bash start-test-db.sh
```

### JWT key errors
```bash
# Regenerate test keys
cd test/fixtures
bash generate-test-keys.sh
```

### Tests hanging or timing out
- Check if test database is accessible
- Ensure `afterEach` and `afterAll` cleanup is working
- Increase timeout in jest config if needed

### Port conflicts
If port 5433 is in use, update `.env.test` and `test/docker-compose.test.yml` to use a different port.

---

## Tips for Success

1. **Start with unit tests** - They're fastest to write and run
2. **Use the example files as templates** - Copy, modify, repeat
3. **Test error cases** - Don't just test the happy path
4. **Keep tests focused** - One assertion per test when possible
5. **Run tests frequently** - Catch issues early
6. **Aim for 80%+ coverage** - But focus on meaningful tests, not just coverage numbers

---

## Coverage Goals

Target coverage (configured in `jest.config.js`):
- **Lines**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Statements**: 80%

Check coverage:
```bash
npm run test:cov
open coverage/index.html  # View detailed report
```

---

## Need Help?

- Review the example test files in detail
- Check the official Jest documentation: https://jestjs.io/
- Check NestJS testing docs: https://docs.nestjs.com/fundamentals/testing
- Look at the test factories and mocks in `test/` directory for reusable utilities

Happy Testing! 🧪
