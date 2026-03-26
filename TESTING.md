# Testing Guide

## Backend Testing (Jest)

### Setup
```bash
cd backend
npm install
```

### Run Tests
```bash
# All tests
npm test

# Coverage report
npm run test:coverage

# Watch mode (for development)
npm run test:watch

# Single file
npm test -- auth.test.ts
```

### Test Structure
```
src/__tests__/
├── setup.ts              # Test configuration
├── unit/                 # Unit tests
│   └── auth.service.test.ts
└── integration/          # Integration tests
    └── health.test.ts
```

### Writing Tests

```typescript
// Unit test example
describe("AuthService", () => {
  it("should hash password correctly", async () => {
    const password = "test123";
    const hash = await bcrypt.hash(password, 10);
    
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });
});

// Integration test example
describe("API Routes", () => {
  it("GET /health should return status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
```

## Frontend Testing (Cypress)

### Setup
```bash
cd frontend
npm install
```

### Run Tests
```bash
# Open Cypress UI
npm run cypress:open

# Run headless
npm run cypress:run

# Full E2E with server
npm run test:e2e
```

### Test Structure
```
cypress/
├── e2e/                  # E2E tests
│   ├── auth.cy.ts
│   └── navigation.cy.ts
├── fixtures/             # Test data
│   └── user.json
└── support/              # Custom commands
    └── e2e.ts
```

### Writing Tests

```typescript
// E2E test example
describe("Authentication", () => {
  it("should login successfully", () => {
    cy.visit("/login");
    cy.get(input[type=email]).type("admin@test.com");
    cy.get(input[type=password]).type("password123");
    cy.get(button[type=submit]).click();
    
    cy.url().should("not.include", "/login");
    cy.contains("Dashboard").should("be.visible");
  });
});
```

### Custom Commands

```typescript
// Login command (in support/e2e.ts)
Cypress.Commands.add("login", (email, password) => {
  cy.visit("/login");
  cy.get(input[type=email]).type(email);
  cy.get(input[type=password]).type(password);
  cy.get(button[type=submit]).click();
});

// Usage in tests
cy.login("admin@test.com", "password123");
```

## CI/CD Testing

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: cd backend && npm ci
      - run: cd backend && npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      with:
          node-version: 20
      - run: cd frontend && npm ci
      - run: cd frontend && npm run cypress:run
```

## Test Data

### Test Database
```bash
# Create test database
docker exec ai-orchestrator-db psql -U aiorchestrator -c "CREATE DATABASE ai_orchestrator_test;"

# Run migrations
export DATABASE_URL="postgresql://aiorchestrator:orch2024secure@localhost:5432/ai_orchestrator_test"
npx prisma migrate deploy
```

### Test Fixtures
```json
// cypress/fixtures/user.json
{
  "email": "test@example.com",
  "password": "testpassword123"
}
```

## Coverage Reports

### Backend
Coverage reports generated in `backend/coverage/`:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html
```

### Frontend
Cypress generates coverage automatically when running tests.

## Best Practices

### Unit Tests
- Изолируйте тесты (mock внешние зависимости)
- Тестируйте граничные случаи
- Используйте descriptive names
- Следуйте AAA pattern (Arrange, Act, Assert)

### E2E Tests
- Тестируйте пользовательские сценарии
- Не тестируйте implementation details
- Используйте data-testid для выбора элементов
- Избегайте лишних действий в тестах

### Test Database
- Используйте отдельную БД для тестов
- Очищайте данные перед каждым тестом
- Используйте transactions для rollback

## Troubleshooting

### Common Issues

**Jest timeout errors:**
```typescript
jest.setTimeout(30000); // Increase timeout
```

**Cypress connection refused:**
```bash
# Ensure backend is running
npm run dev &
npm run cypress:run
```

**Database connection errors:**
```bash
# Check database is running
docker ps | grep postgres

# Test connection
docker exec ai-orchestrator-db psql -U aiorchestrator -c "SELECT 1"
```
