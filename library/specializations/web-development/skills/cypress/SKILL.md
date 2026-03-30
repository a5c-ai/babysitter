---
name: cypress
description: Cypress testing patterns, custom commands, component testing, and CI integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Cypress Skill

Expert assistance for E2E and component testing with Cypress.

## Capabilities

- Write E2E test scenarios
- Create custom commands
- Implement component testing
- Configure CI pipelines
- Handle authentication

## Test Patterns

```typescript
describe('User Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login successfully', () => {
    cy.get('[data-testid="email"]').type('user@example.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');
  });
});
```

## Custom Commands

```typescript
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="password"]').type(password);
    cy.get('[data-testid="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Target Processes

- e2e-testing
- component-testing
- ci-cd-setup
