---
name: Jest Testing
description: Expert Jest testing framework for JavaScript/TypeScript unit and integration testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Jest Testing Skill

## Overview

This skill provides expert-level capabilities for Jest-based testing, enabling comprehensive unit testing, snapshot testing, and integration with React Testing Library.

## Capabilities

### Test Execution
- Configure Jest for various project types (Node, React, TypeScript)
- Execute tests with coverage collection
- Parallel test execution configuration
- Watch mode and selective test running

### Unit Testing
- Write unit tests with proper mocking
- Configure custom matchers and test utilities
- Mock module resolution and timer handling
- Handle async testing patterns

### Snapshot Testing
- Configure and manage snapshot tests
- Handle snapshot updates and reviews
- Implement inline snapshots

### Coverage Analysis
- Coverage report generation and analysis
- Configure coverage thresholds
- Identify uncovered code paths

### React Integration
- Integration with React Testing Library
- Component testing patterns
- Hook testing utilities

## Target Processes

- `automation-framework.js` - Test framework setup
- `mutation-testing.js` - Test quality assessment
- `continuous-testing.js` - CI/CD integration
- `shift-left-testing.js` - Early testing integration

## Dependencies

- `jest` - Test runner
- `@testing-library/react` - React testing utilities
- `ts-jest` - TypeScript support (optional)

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'jest-testing',
    context: {
      action: 'execute-tests',
      testPath: 'src/**/*.test.ts',
      coverage: true,
      coverageThreshold: {
        global: { branches: 80, functions: 80, lines: 80 }
      }
    }
  }
}
```

## Configuration

The skill respects `jest.config.js` or `jest.config.ts` in the project root and can override settings as needed.
