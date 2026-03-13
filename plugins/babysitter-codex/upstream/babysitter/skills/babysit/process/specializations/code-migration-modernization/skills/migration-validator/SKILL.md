---
name: migration-validator
description: Validate functional equivalence after migration with side-by-side comparison and behavioral verification
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Migration Validator Skill

Validates functional equivalence between source and target systems after migration through comprehensive comparison and behavioral verification.

## Purpose

Enable migration validation for:
- Side-by-side comparison
- Output diffing
- Behavioral verification
- Data consistency checking
- Acceptance criteria verification

## Capabilities

### 1. Side-by-Side Comparison
- Run parallel requests
- Compare responses
- Track differences
- Document discrepancies

### 2. Output Diffing
- Compare API responses
- Diff file outputs
- Check data formats
- Validate transformations

### 3. Behavioral Verification
- Test user flows
- Verify business logic
- Check edge cases
- Validate error handling

### 4. Data Consistency Checking
- Compare data states
- Verify calculations
- Check relationships
- Validate constraints

### 5. Integration Validation
- Test external integrations
- Verify API contracts
- Check message flows
- Validate events

### 6. Acceptance Criteria Verification
- Check feature completeness
- Verify requirements
- Validate user stories
- Document coverage

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Diffy | Response comparison | API |
| Contract testing | API verification | CLI |
| Cypress | E2E validation | CLI |
| Playwright | Browser testing | CLI |
| Custom validators | Business rules | CLI |

## Output Schema

```json
{
  "validationId": "string",
  "timestamp": "ISO8601",
  "source": {
    "environment": "string",
    "version": "string"
  },
  "target": {
    "environment": "string",
    "version": "string"
  },
  "results": {
    "total": "number",
    "passed": "number",
    "failed": "number",
    "skipped": "number"
  },
  "comparisons": [
    {
      "test": "string",
      "status": "passed|failed",
      "source": {},
      "target": {},
      "differences": []
    }
  ],
  "acceptance": {
    "criteria": [],
    "met": "boolean"
  }
}
```

## Integration with Migration Processes

- **migration-testing-strategy**: Validation execution
- **parallel-run-validation**: Parallel comparison

## Related Skills

- `performance-baseline-capturer`: Performance comparison
- `data-migration-validator`: Data validation

## Related Agents

- `parallel-run-validator`: Parallel validation
- `regression-detector`: Regression detection
