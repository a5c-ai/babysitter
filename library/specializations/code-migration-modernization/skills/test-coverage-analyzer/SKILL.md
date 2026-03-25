---
name: test-coverage-analyzer
description: Analyze test coverage and identify gaps before migration to ensure adequate safety nets
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Test Coverage Analyzer Skill

Analyzes test coverage comprehensively to identify gaps and ensure adequate test safety nets before undertaking migration efforts.

## Purpose

Enable comprehensive test coverage analysis for:
- Pre-migration coverage assessment
- Critical path coverage verification
- Coverage gap identification
- Test strategy planning
- Regression risk assessment

## Capabilities

### 1. Line/Branch/Path Coverage Measurement
- Calculate line coverage percentages
- Measure branch coverage
- Analyze path coverage
- Track condition coverage

### 2. Coverage Gap Identification
- Find untested code paths
- Identify missing edge cases
- Detect uncovered error handlers
- Map coverage blind spots

### 3. Critical Path Coverage Analysis
- Identify business-critical paths
- Prioritize coverage by importance
- Map risk vs coverage
- Generate focused test recommendations

### 4. Integration Test Coverage Mapping
- Track integration point coverage
- Map API endpoint testing
- Assess database operation coverage
- Verify external service testing

### 5. Coverage Trend Analysis
- Track coverage over time
- Identify coverage regression
- Monitor improvement progress
- Generate trend reports

## Tool Integrations

| Tool | Language | Integration Method |
|------|----------|-------------------|
| Istanbul/nyc | JavaScript/TypeScript | CLI |
| JaCoCo | Java | CLI / Maven/Gradle |
| Cobertura | Java/Python | CLI |
| Coverage.py | Python | CLI |
| SimpleCov | Ruby | CLI |
| go test -cover | Go | CLI |
| dotCover | .NET | CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "coverage": {
    "line": {
      "percentage": "number",
      "covered": "number",
      "total": "number"
    },
    "branch": {
      "percentage": "number",
      "covered": "number",
      "total": "number"
    },
    "function": {
      "percentage": "number",
      "covered": "number",
      "total": "number"
    }
  },
  "gaps": [
    {
      "file": "string",
      "uncoveredLines": ["number"],
      "uncoveredBranches": ["string"],
      "criticality": "high|medium|low",
      "recommendation": "string"
    }
  ],
  "criticalPaths": {
    "covered": "number",
    "total": "number",
    "uncoveredPaths": []
  }
}
```

## Integration with Migration Processes

- **migration-testing-strategy**: Coverage baseline establishment
- **code-refactoring**: Pre-refactoring safety assessment
- **framework-upgrade**: Regression protection verification

## Related Skills

- `characterization-test-generator`: Generate tests for gaps
- `static-code-analyzer`: Combined quality analysis

## Related Agents

- `migration-testing-strategist`: Uses for test planning
- `regression-detector`: Uses for regression prevention
