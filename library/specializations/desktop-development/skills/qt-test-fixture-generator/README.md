# qt-test-fixture-generator

Generate Qt Test fixtures with mock QObjects and data-driven tests.

## Overview

This skill creates comprehensive QTest-based test infrastructure including test fixtures, mock objects, data providers, and CMake integration.

## Quick Start

```javascript
const result = await invokeSkill('qt-test-fixture-generator', {
  projectPath: '/path/to/qt-project',
  classToTest: 'MyWidget',
  testType: 'unit',
  mockDependencies: ['DataService', 'NetworkManager'],
  dataProviders: [
    {
      testName: 'testCalculation',
      columns: ['input', 'expected'],
      rows: [['10', '20'], ['0', '0'], ['-5', '-10']]
    }
  ],
  generateCoverage: true
});
```

## Features

### Test Types

| Type | Description |
|------|-------------|
| unit | Isolated class testing |
| integration | Component interaction |
| gui | Widget interaction testing |
| benchmark | Performance measurement |

### Generated Components

- Test class with lifecycle methods
- Mock objects with call tracking
- Data providers for parameterized tests
- CMake configuration

## Running Tests

```bash
# All tests
ctest --test-dir build

# Single test
./build/tests/tst_mywidget

# Specific function
./build/tests/tst_mywidget testSetValue
```

## Related Skills

- `qt-cmake-project-generator`
- `cross-platform-test-matrix`

## Related Agents

- `qt-cpp-specialist`
- `desktop-test-architect`
