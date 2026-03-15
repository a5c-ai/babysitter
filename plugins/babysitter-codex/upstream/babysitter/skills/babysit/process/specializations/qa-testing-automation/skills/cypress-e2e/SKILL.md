---
name: Cypress E2E Testing
description: Expert Cypress testing framework integration for browser-based end-to-end testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Cypress E2E Testing Skill

## Overview

This skill provides expert-level capabilities for Cypress-based end-to-end testing, enabling comprehensive browser automation, component testing, and seamless CI/CD integration.

## Capabilities

### Test Execution
- Execute Cypress tests with custom configurations
- Run tests in interactive and headless modes
- Configure parallel test execution
- Handle component testing integration

### Code Generation
- Generate custom Cypress commands
- Create reusable test utilities
- Implement fixtures and test data factories

### API Mocking
- Handle intercept/stub patterns for API mocking
- Configure response fixtures
- Implement conditional stubbing

### Debugging & Analysis
- Debug test failures with video/screenshot analysis
- Analyze Cypress Dashboard results
- Identify and resolve flaky tests

### Plugin Integration
- Configure Cypress plugins
- Integrate with code coverage tools
- Set up custom reporters

## Target Processes

- `e2e-test-suite.js` - Full E2E test suite implementation
- `cross-browser-testing.js` - Cross-browser compatibility testing
- `visual-regression.js` - Visual regression with Cypress snapshots
- Component testing workflows

## Dependencies

- `cypress` - Cypress test runner
- `@cypress/code-coverage` - Coverage plugin (optional)
- Node.js 18+

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'cypress-e2e',
    context: {
      action: 'execute-tests',
      spec: 'cypress/e2e/**/*.cy.ts',
      browser: 'chrome',
      headless: true
    }
  }
}
```

## Configuration

The skill respects `cypress.config.ts` or `cypress.config.js` in the project root and can override settings as needed for specific test runs.
