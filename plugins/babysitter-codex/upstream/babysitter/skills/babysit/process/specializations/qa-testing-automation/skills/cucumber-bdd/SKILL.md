---
name: Cucumber BDD Testing
description: Cucumber/Gherkin BDD testing for behavior-driven development workflows
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Cucumber BDD Testing Skill

## Overview

This skill provides expert-level capabilities for Cucumber-based BDD testing, enabling feature file creation, step definition generation, and living documentation.

## Capabilities

### Feature File Development
- Write Gherkin feature files
- Structure scenarios effectively
- Implement scenario outlines
- Use backgrounds for common setup

### Step Definition Generation
- Generate step definitions from features
- Implement reusable step patterns
- Handle step parameters and transformations

### Data Handling
- Handle data tables
- Implement doc strings
- Configure example tables for outlines

### Configuration
- Configure Cucumber profiles
- Set up parallel execution
- Configure formatters and reporters

### Tag Management
- Implement tag-based test filtering
- Configure tag expressions
- Organize tests with tags

### Reporting
- Generate Cucumber reports
- HTML and JSON formatters
- JUnit XML output

### Living Documentation
- Generate living documentation
- Keep specs and tests synchronized
- Enable non-technical stakeholder collaboration

### Framework Integration
- Integration with Playwright/Cypress
- Integration with Selenium
- Integration with API testing frameworks

## Target Processes

- `e2e-test-suite.js` - BDD-style E2E tests
- `test-strategy.js` - BDD strategy implementation
- `shift-left-testing.js` - Early BDD adoption

## Dependencies

- `@cucumber/cucumber` - Cucumber.js
- Step definition framework
- Test automation framework

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'cucumber-bdd',
    context: {
      action: 'execute-features',
      featurePath: 'features/**/*.feature',
      tags: '@smoke and not @wip',
      format: ['html:reports/cucumber.html', 'json:reports/cucumber.json']
    }
  }
}
```

## Configuration

The skill uses `cucumber.js` configuration file and supports multiple output formats.
