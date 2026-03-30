---
name: Stryker Mutation Testing
description: Stryker mutation testing for assessing test suite quality and effectiveness
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Stryker Mutation Testing Skill

## Overview

This skill provides expert-level capabilities for Stryker-based mutation testing, enabling test quality assessment by introducing code mutations and measuring test effectiveness.

## Capabilities

### Mutation Execution
- Configure Stryker for JavaScript/TypeScript
- Execute mutation testing runs
- Configure mutation operators

### Score Analysis
- Analyze mutation score
- Track killed vs survived mutants
- Identify weak test assertions

### Configuration
- Configure mutators and test runners
- Set up file patterns for mutation
- Configure timeout settings

### Reporting
- Generate HTML mutation reports
- Dashboard integration for tracking
- CI/CD report generation

### Optimization
- Configure incremental mutation testing
- Optimize mutation runs for large codebases
- Parallel mutation execution

### Test Quality Insights
- Identify gaps in test coverage
- Recommend assertion improvements
- Prioritize test enhancements

## Target Processes

- `mutation-testing.js` - Mutation testing implementation
- `quality-gates.js` - Mutation score gates
- `shift-left-testing.js` - Early test quality validation

## Dependencies

- `@stryker-mutator/core` - Stryker core
- Test runner plugins (jest-runner, karma-runner)
- Reporter plugins

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'stryker-mutation',
    context: {
      action: 'execute',
      configFile: 'stryker.conf.json',
      mutate: ['src/**/*.ts'],
      thresholds: {
        high: 80,
        low: 60,
        break: 50
      }
    }
  }
}
```

## Configuration

The skill uses `stryker.conf.json` or `stryker.conf.js` and supports incremental testing for faster feedback.
