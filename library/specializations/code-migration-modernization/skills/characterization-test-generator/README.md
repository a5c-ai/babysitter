# Characterization Test Generator Skill

## Overview

The Characterization Test Generator skill creates tests that capture existing system behavior before migration. These "golden master" tests serve as a safety net during code changes, ensuring functional equivalence is maintained throughout the migration process.

## Quick Start

### Prerequisites

- Target codebase with executable code
- Test framework installed:
  - Jest (JavaScript/TypeScript)
  - pytest (Python)
  - JUnit (Java)
  - NUnit (.NET)
- Optional: ApprovalTests library for approval-based testing

### Basic Usage

1. **Install test framework dependencies**
   ```bash
   # JavaScript/TypeScript
   npm install --save-dev jest @types/jest

   # Python
   pip install pytest pytest-snapshot

   # Java (Maven)
   # Add ApprovalTests dependency to pom.xml
   ```

2. **Generate characterization tests**
   ```bash
   # The skill analyzes code and generates tests
   # Output goes to ./tests/characterization/
   ```

3. **Review and approve baselines**
   ```bash
   # Run tests to generate initial snapshots
   npm test -- --updateSnapshot

   # Review generated snapshots
   ls tests/characterization/__snapshots__/
   ```

4. **Integrate into CI**
   ```yaml
   # GitHub Actions example
   - name: Run Characterization Tests
     run: npm test -- --ci
   ```

## Features

### Test Generation Strategies

| Strategy | Use Case | Pros | Cons |
|----------|----------|------|------|
| Snapshot | Simple outputs | Easy setup, auto-generated | Large diffs |
| Approval | Complex outputs | Human review | Manual approval |
| Recording | External calls | Real behavior capture | Setup complexity |
| Contract | API boundaries | Clear contracts | Specification effort |

### Input Discovery

The skill automatically discovers test inputs from:

- Existing unit tests
- Integration tests
- API documentation
- Database seeds
- Log analysis
- Code path analysis

### Output Capture

Captures and normalizes:

- Return values
- Side effects (file writes, database changes)
- External API calls
- Events emitted
- Logs generated
- Performance metrics

## Configuration

### Project Configuration

Create `.characterization-tests.json`:

```json
{
  "testFramework": "auto",
  "language": "auto",
  "outputDir": "./tests/characterization",
  "goldenMasterDir": "./tests/golden-masters",
  "captureMode": "snapshot",
  "targets": {
    "include": [
      "src/services/**/*.ts",
      "src/domain/**/*.ts"
    ],
    "exclude": [
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/index.ts"
    ]
  },
  "inputGeneration": {
    "strategy": "comprehensive",
    "boundary": true,
    "combinatorial": true,
    "maxCombinations": 100,
    "valueTypes": {
      "string": ["", "a", "normal string", "very long string..."],
      "number": [0, 1, -1, "MIN", "MAX", "NaN", "Infinity"],
      "boolean": [true, false],
      "array": [[], ["single"], ["multiple", "items"]],
      "object": [{}, "null", "valid-sample"]
    }
  },
  "outputNormalization": {
    "removeTimestamps": true,
    "removeIds": true,
    "removePaths": ["$.metadata.generatedAt"],
    "sortArrays": false,
    "tolerance": {
      "numeric": 0.001,
      "dateTime": "1000ms"
    }
  },
  "dependencies": {
    "mockStrategy": "record-replay",
    "externalServices": {
      "https://api.example.com": "mock",
      "database": "in-memory"
    }
  },
  "approval": {
    "enabled": true,
    "reporter": "diff",
    "approvalDir": "./tests/approvals"
  },
  "ci": {
    "failOnNewSnapshots": true,
    "failOnMissingApprovals": true,
    "updateCommand": "npm test -- -u"
  }
}
```

### Framework-Specific Configuration

#### Jest (JavaScript/TypeScript)

```javascript
// jest.config.js additions
module.exports = {
  // ... existing config
  snapshotSerializers: [
    './tests/characterization/serializers/normalize-dates.js'
  ],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true
  }
};
```

#### pytest (Python)

```python
# conftest.py additions
import pytest
from pytest_snapshot.plugin import Snapshot

@pytest.fixture
def normalize_snapshot(snapshot):
    """Custom snapshot normalizer"""
    def _normalize(data):
        if isinstance(data, dict):
            data.pop('timestamp', None)
            data.pop('request_id', None)
        return data

    snapshot.snapshot_dir = 'tests/golden-masters'
    return snapshot
```

#### JUnit (Java)

```java
// ApprovalTests configuration
public class CharacterizationTestBase {

    @BeforeAll
    static void setup() {
        Approvals.settings()
            .useFolder("tests/approvals")
            .useReporter(DiffReporter.INSTANCE);
    }

    protected Options defaultOptions() {
        return new Options()
            .withScrubber(new DateScrubber())
            .withScrubber(new GuidScrubber());
    }
}
```

## Output Examples

### Generated Test Suite (Jest)

```javascript
// tests/characterization/services/user-service.characterization.test.ts

import { UserService } from '../../../src/services/user-service';
import { mockDatabase } from '../../mocks/database';
import { mockExternalApi } from '../../mocks/external-api';

describe('UserService Characterization Tests', () => {
  let service: UserService;

  beforeEach(() => {
    mockDatabase.reset();
    mockExternalApi.reset();
    service = new UserService();
  });

  describe('getUserProfile', () => {
    it('should return profile for valid user', () => {
      mockDatabase.seedUser({ id: 'U001', name: 'John Doe' });

      const result = service.getUserProfile('U001');

      expect(result).toMatchSnapshot();
    });

    it('should handle non-existent user', () => {
      const result = service.getUserProfile('NONEXISTENT');

      expect(result).toMatchSnapshot();
    });

    it('should handle null input', () => {
      expect(() => service.getUserProfile(null))
        .toThrowErrorMatchingSnapshot();
    });
  });

  describe('calculateDiscount', () => {
    const testCases = [
      { name: 'standard customer', input: { amount: 100, loyalty: 500 } },
      { name: 'premium customer', input: { amount: 100, loyalty: 5000, premium: true } },
      { name: 'zero amount', input: { amount: 0, loyalty: 0 } },
      { name: 'maximum amount', input: { amount: 999999.99, loyalty: 999999 } },
      { name: 'negative amount', input: { amount: -100, loyalty: 500 } },
    ];

    testCases.forEach(({ name, input }) => {
      it(`should match snapshot for ${name}`, () => {
        const result = service.calculateDiscount(input);
        expect(result).toMatchSnapshot();
      });
    });
  });
});
```

### Golden Master File

```json
// tests/golden-masters/user-service/getUserProfile-valid-user.json
{
  "id": "U001",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "profile": {
    "loyaltyTier": "gold",
    "points": 5000,
    "memberSince": "[DATE]"
  },
  "preferences": {
    "notifications": true,
    "theme": "light"
  }
}
```

### Coverage Report

```markdown
# Characterization Test Coverage Report

## Summary
- **Units Analyzed**: 45
- **Tests Generated**: 187
- **Edge Cases Covered**: 312
- **Estimated Coverage**: 78%

## Coverage by Module

| Module | Functions | Covered | Missing |
|--------|-----------|---------|---------|
| services/user | 12 | 10 | 2 |
| services/order | 18 | 15 | 3 |
| services/payment | 8 | 8 | 0 |
| domain/discount | 5 | 5 | 0 |

## Uncovered Functions

1. `services/user/deleteUser` - Requires admin permissions
2. `services/user/exportData` - External dependency not mockable
3. `services/order/refund` - Payment gateway integration
```

## Integration with Babysitter SDK

### Using in a Process

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const generateCharacterizationTestsTask = defineTask(
  'generate-characterization-tests',
  (args, ctx) => ({
    kind: 'skill',
    title: 'Generate Characterization Tests',
    skill: {
      name: 'characterization-test-generator',
      context: {
        targetPath: args.sourcePath,
        testFramework: args.framework || 'auto',
        outputDir: args.outputDir || './tests/characterization',
        captureMode: args.captureMode || 'snapshot'
      }
    },
    io: {
      inputJsonPath: `tasks/${ctx.effectId}/input.json`,
      outputJsonPath: `tasks/${ctx.effectId}/result.json`
    }
  })
);
```

### Process Integration

This skill is used by these migration processes:

1. **migration-testing-strategy** - Baseline test creation
2. **code-refactoring** - Behavior verification
3. **framework-upgrade** - Pre/post upgrade validation
4. **monolith-to-microservices** - Service extraction testing

## CLI Examples

### Jest Snapshot Testing

```bash
# Generate initial snapshots
npm test -- --updateSnapshot

# Run characterization tests
npm test -- tests/characterization/

# Update specific snapshot
npm test -- tests/characterization/user-service.test.ts -u
```

### pytest Snapshot Testing

```bash
# Run with snapshot update
pytest tests/characterization/ --snapshot-update

# Run in CI mode (fail on new snapshots)
pytest tests/characterization/ --snapshot-warn-unused
```

### ApprovalTests

```bash
# Run approval tests
mvn test -Dtest=*CharacterizationTest

# Approve changes (manual)
# Open reporter and approve diffs
```

## Handling Non-Determinism

### Timestamps

```javascript
// Jest serializer for dates
expect.addSnapshotSerializer({
  test: (val) => val instanceof Date,
  print: () => '"[TIMESTAMP]"'
});
```

### UUIDs/IDs

```javascript
// Normalize IDs in output
const normalizeIds = (obj) => {
  if (obj.id && typeof obj.id === 'string') {
    obj.id = '[ID]';
  }
  return obj;
};
```

### Random Values

```javascript
// Mock random generators
jest.spyOn(Math, 'random').mockReturnValue(0.5);
```

## Troubleshooting

### Common Issues

**Snapshot too large**
```
Warning: Snapshot file size exceeds threshold
```
Solution: Split into smaller test cases or use approval testing

**Non-deterministic failures**
```
Error: Snapshot mismatch - timestamp differs
```
Solution: Add normalizers for timestamps, IDs, and random values

**External dependency failure**
```
Error: Network request failed
```
Solution: Use record-replay mocking for external services

### Debug Mode

```json
{
  "debug": true,
  "verboseOutput": true,
  "saveIntermediateResults": true
}
```

## Best Practices

1. **Generate Before Changes**: Create tests before any migration work
2. **Review Golden Masters**: Human review initial baselines carefully
3. **Normalize Non-Determinism**: Handle timestamps, IDs, random values
4. **Version Control**: Store golden masters in version control
5. **CI Integration**: Fail builds on unexpected changes
6. **Incremental Updates**: Update baselines one change at a time
7. **Document Exceptions**: Document why certain behaviors are expected

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [ApprovalTests](https://approvaltests.com/)
- [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
- [Working Effectively with Legacy Code](https://www.oreilly.com/library/view/working-effectively-with/0131177052/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |
