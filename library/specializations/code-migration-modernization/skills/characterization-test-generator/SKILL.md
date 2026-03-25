---
name: characterization-test-generator
description: Generate characterization tests to capture and verify existing behavior before migration
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Characterization Test Generator Skill

Generates characterization tests (also known as golden master tests or approval tests) to capture existing system behavior before migration, ensuring functional equivalence after changes.

## Purpose

Enable behavior preservation during migration through:
- Golden master test creation
- Approval test generation
- Edge case discovery
- Input/output recording
- Behavior snapshot capture
- Regression baseline establishment

## Capabilities

### 1. Golden Master Test Creation
- Capture current system outputs for given inputs
- Store outputs as reference "golden" files
- Generate comparison test infrastructure
- Support multiple output formats
- Enable baseline versioning

### 2. Approval Test Generation
- Create human-reviewable test outputs
- Generate diff-based comparison tests
- Support approval workflows
- Enable incremental approval
- Track approval history

### 3. Edge Case Discovery
- Analyze code paths for boundary conditions
- Generate boundary value inputs
- Identify error handling scenarios
- Map exception paths
- Create comprehensive test coverage

### 4. Input/Output Recording
- Instrument code for I/O capture
- Record API request/response pairs
- Capture database interactions
- Log external service calls
- Store timing and sequence data

### 5. Behavior Snapshot
- Capture state at key points
- Record side effects
- Document non-deterministic behavior
- Identify environmental dependencies
- Map configuration impacts

### 6. Regression Baseline Establishment
- Create baseline test suites
- Define acceptance thresholds
- Configure tolerance levels
- Set up CI/CD integration
- Generate coverage reports

## Tool Integrations

This skill can leverage the following external tools when available:

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| ApprovalTests | Approval testing framework | Library |
| Jest snapshots | JavaScript snapshot testing | Framework |
| pytest-snapshot | Python snapshot testing | Plugin |
| TextTest | Golden master testing | CLI |
| Verify | .NET approval testing | Library |
| Scientist | Safe refactoring library | Library |
| AI Testing MCP | AI-powered test generation | MCP Server |

## Usage

### Basic Test Generation

```bash
# Invoke skill for characterization test generation
# The skill will analyze code and generate tests

# Expected inputs:
# - targetPath: Path to code to characterize
# - testFramework: 'jest' | 'pytest' | 'junit' | 'nunit' | 'auto'
# - outputDir: Directory for generated tests
# - captureMode: 'snapshot' | 'approval' | 'recording'
```

### Generation Workflow

1. **Analysis Phase**
   - Identify testable units (functions, methods, endpoints)
   - Map input parameters and types
   - Detect output formats
   - Find external dependencies

2. **Input Discovery Phase**
   - Extract existing test inputs
   - Generate boundary values
   - Identify representative cases
   - Create combinatorial inputs

3. **Capture Phase**
   - Execute code with inputs
   - Record outputs and side effects
   - Capture state changes
   - Log external interactions

4. **Test Generation Phase**
   - Generate test code structure
   - Create golden master files
   - Set up comparison logic
   - Configure CI integration

## Output Schema

```json
{
  "generationId": "string",
  "timestamp": "ISO8601",
  "target": {
    "path": "string",
    "language": "string",
    "framework": "string",
    "unitsAnalyzed": "number"
  },
  "testsGenerated": {
    "total": "number",
    "byType": {
      "snapshot": "number",
      "approval": "number",
      "recording": "number"
    },
    "coverage": {
      "functions": "number",
      "branches": "number",
      "lines": "number"
    }
  },
  "characterizations": [
    {
      "unit": "string",
      "type": "function|method|endpoint|class",
      "inputs": [
        {
          "name": "string",
          "type": "string",
          "values": ["any"],
          "source": "existing|generated|boundary"
        }
      ],
      "outputs": {
        "type": "string",
        "goldenMasterPath": "string",
        "checksum": "string"
      },
      "testFile": "string",
      "baselineApproved": "boolean"
    }
  ],
  "edgeCases": [
    {
      "unit": "string",
      "case": "string",
      "input": "any",
      "expectedBehavior": "string",
      "covered": "boolean"
    }
  ],
  "dependencies": {
    "external": ["string"],
    "mocked": ["string"],
    "recorded": ["string"]
  },
  "artifacts": {
    "testSuite": "string",
    "goldenMasters": "string",
    "recordings": "string",
    "coverageReport": "string"
  }
}
```

## Integration with Migration Processes

This skill integrates with the following Code Migration/Modernization processes:

- **migration-testing-strategy**: Primary tool for test baseline creation
- **code-refactoring**: Ensure behavior preservation during refactoring
- **framework-upgrade**: Verify functionality after upgrade
- **monolith-to-microservices**: Validate service extraction

## Configuration

### Skill Configuration File

Create `.characterization-tests.json` in the project root:

```json
{
  "testFramework": "auto",
  "outputDir": "./tests/characterization",
  "captureMode": "snapshot",
  "goldenMasterDir": "./tests/golden-masters",
  "inputGeneration": {
    "boundary": true,
    "combinatorial": true,
    "maxCombinations": 100,
    "includeNulls": true,
    "includeEmpty": true
  },
  "outputCapture": {
    "format": "json",
    "normalizeWhitespace": true,
    "ignorePaths": ["$.timestamp", "$.requestId"],
    "tolerance": {
      "numeric": 0.001,
      "dateTime": "1s"
    }
  },
  "dependencies": {
    "mockExternal": true,
    "recordMode": false,
    "replayMode": true
  },
  "approval": {
    "requireApproval": true,
    "approvalDir": "./tests/approvals",
    "reportFormat": "markdown"
  },
  "ci": {
    "failOnNewTests": false,
    "updateGoldenOnPass": false,
    "generateCoverageReport": true
  }
}
```

## MCP Server Integration

When AI Testing MCP Server is available:

```javascript
// Example AI-powered test generation
{
  "tool": "ai_testing_generate",
  "arguments": {
    "target": "./src/services/user.ts",
    "framework": "jest",
    "style": "characterization"
  }
}
```

## Test Patterns

### Snapshot Testing (Jest)

```javascript
// Generated characterization test
describe('UserService', () => {
  describe('calculateDiscount', () => {
    it('should match snapshot for standard customer', () => {
      const result = userService.calculateDiscount({
        customerId: 'C001',
        purchaseAmount: 100,
        loyaltyPoints: 500
      });
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for premium customer', () => {
      const result = userService.calculateDiscount({
        customerId: 'C002',
        purchaseAmount: 100,
        loyaltyPoints: 5000,
        isPremium: true
      });
      expect(result).toMatchSnapshot();
    });

    // Edge cases
    it('should match snapshot for zero amount', () => {
      const result = userService.calculateDiscount({
        customerId: 'C001',
        purchaseAmount: 0,
        loyaltyPoints: 0
      });
      expect(result).toMatchSnapshot();
    });
  });
});
```

### Approval Testing (ApprovalTests)

```java
// Generated approval test
public class UserServiceCharacterizationTest {

    @Test
    public void calculateDiscount_standardCustomer() {
        UserService service = new UserService();
        DiscountResult result = service.calculateDiscount(
            new DiscountRequest("C001", 100.0, 500)
        );
        Approvals.verify(result);
    }

    @Test
    public void calculateDiscount_boundaryValues() {
        UserService service = new UserService();

        // Boundary: minimum values
        Approvals.verify(service.calculateDiscount(
            new DiscountRequest("C001", 0.01, 0)
        ), "minimum");

        // Boundary: maximum values
        Approvals.verify(service.calculateDiscount(
            new DiscountRequest("C001", 999999.99, 999999)
        ), "maximum");
    }
}
```

### Recording Tests (Python)

```python
# Generated recording-based test
import pytest
from tests.recordings import PlaybackRecorder

class TestUserServiceCharacterization:

    @pytest.fixture
    def recorder(self):
        return PlaybackRecorder('tests/recordings/user_service')

    def test_get_user_profile_recorded(self, recorder):
        """Replay recorded external API interactions"""
        with recorder.playback('get_user_profile_c001'):
            service = UserService()
            result = service.get_user_profile('C001')

            assert result == recorder.expected_output()

    def test_update_user_settings_recorded(self, recorder):
        """Verify database interactions match recording"""
        with recorder.playback('update_settings_c001'):
            service = UserService()
            result = service.update_settings('C001', {'theme': 'dark'})

            recorder.verify_database_calls()
            assert result == recorder.expected_output()
```

## Edge Case Categories

### Boundary Values
- Minimum/maximum values
- Zero values
- Empty strings/arrays
- Null/undefined values
- Type boundaries (INT_MAX, etc.)

### Error Conditions
- Invalid inputs
- Missing required fields
- Type mismatches
- Constraint violations
- Authentication failures

### Concurrent Scenarios
- Race conditions
- Deadlocks
- Timeout scenarios
- Partial failures
- Retry behaviors

### Environmental
- Configuration variations
- Timezone differences
- Locale changes
- Feature flag states
- Permission levels

## Best Practices

1. **Start Before Changes**: Generate characterization tests before any migration work
2. **Capture Everything**: Record all outputs, side effects, and state changes
3. **Version Golden Masters**: Store golden masters in version control
4. **Review Approvals**: Human review of initial golden masters is essential
5. **Handle Non-Determinism**: Normalize timestamps, IDs, and random values
6. **Incremental Updates**: Update baselines incrementally as changes are approved
7. **CI Integration**: Fail builds on unexpected behavior changes

## Related Skills

- `test-coverage-analyzer`: Analyze coverage gaps
- `migration-validator`: Validate migration results
- `static-code-analyzer`: Identify testable code paths

## Related Agents

- `migration-testing-strategist`: Uses this skill for test strategy
- `regression-detector`: Uses this skill for regression detection
- `parallel-run-validator`: Uses this skill for comparison testing

## References

- [ApprovalTests](https://github.com/approvals)
- [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
- [AI Testing MCP](https://github.com/Twisted66/ai-testing-mcp)
- [Working Effectively with Legacy Code](https://www.oreilly.com/library/view/working-effectively-with/0131177052/)
- [Characterization Tests](https://michaelfeathers.silvrback.com/characterization-testing)
