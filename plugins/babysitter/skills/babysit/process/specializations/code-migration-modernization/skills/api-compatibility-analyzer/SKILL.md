---
name: api-compatibility-analyzer
description: Analyze API changes for backward compatibility with breaking change detection and consumer impact assessment
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# API Compatibility Analyzer Skill

Analyzes API changes between versions to detect breaking changes, assess consumer impact, and suggest migration strategies.

## Purpose

Enable API versioning management for:
- Breaking change detection
- Deprecation analysis
- Version comparison
- Consumer impact assessment
- Migration path suggestion

## Capabilities

### 1. Breaking Change Detection
- Detect removed endpoints
- Identify removed fields
- Find type changes
- Flag required field additions

### 2. Deprecation Analysis
- Track deprecated endpoints
- Monitor deprecation timelines
- Identify usage of deprecated APIs
- Plan sunset schedules

### 3. Version Comparison
- Compare OpenAPI specs
- Generate detailed diffs
- Categorize changes
- Document migrations

### 4. Consumer Impact Assessment
- Map affected consumers
- Estimate migration effort
- Identify high-impact changes
- Prioritize notifications

### 5. Migration Path Suggestion
- Recommend upgrade steps
- Suggest compatibility layers
- Propose versioning strategies
- Design adapter patterns

### 6. Compatibility Layer Design
- Design facade endpoints
- Plan response translation
- Handle version negotiation
- Implement fallbacks

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| OpenAPI-diff | Spec comparison | CLI |
| Optic | API change detection | CLI |
| Akita | Traffic-based detection | API |
| swagger-diff | Swagger comparison | CLI |
| Spectral | API linting | CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "versions": {
    "base": "string",
    "target": "string"
  },
  "changes": {
    "breaking": [
      {
        "type": "string",
        "path": "string",
        "description": "string",
        "migration": "string"
      }
    ],
    "nonBreaking": [],
    "deprecations": []
  },
  "impact": {
    "consumers": [],
    "severity": "string",
    "migrationEffort": "string"
  },
  "recommendations": []
}
```

## Integration with Migration Processes

- **api-modernization**: Compatibility verification
- **framework-upgrade**: API impact analysis

## Related Skills

- `api-inventory-scanner`: Endpoint discovery
- `openapi-generator`: Spec generation

## Related Agents

- `api-modernization-architect`: Versioning strategy
