---
name: pytest Testing
description: Expert pytest framework for Python unit, integration, and functional testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# pytest Testing Skill

## Overview

This skill provides expert-level capabilities for pytest-based testing, enabling comprehensive Python testing with fixtures, parametrization, and plugin integration.

## Capabilities

### Test Execution
- Configure pytest with fixtures and markers
- Execute tests with coverage collection
- Parallel execution with pytest-xdist
- Selective test running with markers and keywords

### Fixture Management
- Design reusable fixtures
- Configure fixture scopes (function, class, module, session)
- Implement fixture factories

### Parametrization
- Generate parametrized test cases
- Data-driven testing patterns
- Combine multiple parameter sets

### Plugin Integration
- Configure pytest plugins
- Coverage integration with pytest-cov
- HTML and JUnit XML report generation
- Custom plugin development

### Framework Integration
- Django test client integration
- Flask testing patterns
- FastAPI test client usage

## Target Processes

- `automation-framework.js` - Test framework setup
- `api-testing.js` - API test implementation
- `continuous-testing.js` - CI/CD integration
- `shift-left-testing.js` - Early testing integration

## Dependencies

- `pytest` - Test framework
- `pytest-cov` - Coverage plugin
- `pytest-xdist` - Parallel execution
- `pytest-html` - HTML reports

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'pytest-testing',
    context: {
      action: 'execute-tests',
      testPath: 'tests/',
      markers: ['unit', 'integration'],
      coverage: true,
      parallel: 4
    }
  }
}
```

## Configuration

The skill respects `pytest.ini`, `pyproject.toml`, or `setup.cfg` configuration and can override settings as needed.
