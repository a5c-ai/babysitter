---
name: Playwright E2E Testing
description: Deep integration with Playwright for browser automation and end-to-end testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Playwright E2E Testing Skill

## Overview

This skill provides expert-level capabilities for Playwright-based end-to-end testing, enabling comprehensive browser automation, test generation, and result analysis.

## Capabilities

### Test Execution
- Execute Playwright tests with custom configurations
- Run tests in headed/headless modes
- Configure parallel execution and sharding
- Handle browser contexts and viewport settings

### Code Generation
- Generate Page Object classes from page analysis
- Create test code from user flow descriptions
- Implement reusable test utilities and helpers

### Debugging & Analysis
- Debug test failures with trace analysis
- Analyze Playwright reports and screenshots
- Identify flaky test patterns
- Provide remediation recommendations

### Network & Mocking
- Handle network interception and mocking
- Configure API response stubs
- Implement request/response validation

### Cross-Browser Support
- Configure tests for Chrome, Firefox, Safari, Edge
- Handle browser-specific quirks
- Implement responsive testing across viewports

## Target Processes

- `e2e-test-suite.js` - Full E2E test suite implementation
- `cross-browser-testing.js` - Cross-browser compatibility testing
- `visual-regression.js` - Visual regression with Playwright screenshots
- `accessibility-testing.js` - Accessibility testing with axe-playwright

## Dependencies

- `@playwright/test` - Playwright test runner
- `playwright` - Browser automation library
- Node.js 18+

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'playwright-e2e',
    context: {
      action: 'execute-tests',
      testPath: 'tests/e2e/**/*.spec.ts',
      browsers: ['chromium', 'firefox'],
      parallel: true
    }
  }
}
```

## Configuration

The skill respects `playwright.config.ts` or `playwright.config.js` in the project root and can override settings as needed for specific test runs.
