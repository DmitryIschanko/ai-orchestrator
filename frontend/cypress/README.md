# Cypress E2E Tests

## Setup

```bash
npm install
```

## Running Tests

### Open Cypress UI (Interactive mode)
```bash
npm run cypress:open
```

### Run all tests headless
```bash
npm run cypress:run
```

### Run specific test file
```bash
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

## Test Structure

```
cypress/
├── e2e/                    # E2E test files
│   ├── auth.cy.ts         # Authentication tests
│   ├── dashboard.cy.ts    # Dashboard tests
│   ├── goals.cy.ts        # Goals management tests
│   ├── tickets.cy.ts      # Tickets/Kanban tests
│   └── navigation.cy.ts   # Navigation tests
├── fixtures/              # Test data
│   └── user.json
├── support/               # Support files
│   └── e2e.ts            # Custom commands
└── README.md
```

## Custom Commands

- `cy.login(email, password)` - Login user
- `cy.logout()` - Logout user
- `cy.createGoal(title, type)` - Create a goal
- `cy.createTicket(title, priority)` - Create a ticket

## Best Practices

1. Use custom commands for repetitive actions
2. Add data-testid attributes for reliable selectors
3. Clean up test data after tests
4. Use fixtures for test data
