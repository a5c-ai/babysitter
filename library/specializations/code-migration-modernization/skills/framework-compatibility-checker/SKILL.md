---
name: framework-compatibility-checker
description: Check codebase compatibility with target framework versions and generate migration paths
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Framework Compatibility Checker Skill

Checks codebase compatibility with target framework versions, identifies breaking changes, and recommends migration paths.

## Purpose

Enable framework upgrade assessment for:
- Deprecated API detection
- Breaking change impact analysis
- Compatibility matrix generation
- Migration path recommendation
- Risk assessment

## Capabilities

### 1. Deprecated API Usage Detection
- Find deprecated method calls
- Identify removed APIs
- Detect obsolete patterns
- Map replacement APIs

### 2. Breaking Change Impact Analysis
- Analyze upgrade changelogs
- Match breaking changes to code
- Estimate impact scope
- Prioritize by severity

### 3. Compatibility Matrix Generation
- Map current vs target versions
- List compatible dependencies
- Identify version conflicts
- Generate upgrade paths

### 4. Migration Path Recommendation
- Suggest incremental upgrades
- Identify intermediate versions
- Recommend safe upgrade order
- Plan breaking change handling

### 5. Risk Assessment
- Score upgrade difficulty
- Identify high-risk areas
- Estimate testing needs
- Calculate timeline impact

## Tool Integrations

| Tool | Framework | Integration Method |
|------|-----------|-------------------|
| Angular Update Guide | Angular | Web / API |
| React Codemod | React | CLI |
| Next.js Upgrade | Next.js | CLI |
| Spring Boot Migrator | Spring | CLI |
| Vue Migration Guide | Vue | Web / CLI |
| .NET Upgrade Assistant | .NET | CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "current": {
    "framework": "string",
    "version": "string"
  },
  "target": {
    "framework": "string",
    "version": "string"
  },
  "compatibility": {
    "compatible": "boolean",
    "breakingChanges": [
      {
        "type": "string",
        "description": "string",
        "locations": [],
        "migration": "string",
        "effort": "string"
      }
    ],
    "deprecations": [],
    "removedApis": []
  },
  "migrationPath": {
    "steps": [],
    "intermediateVersions": [],
    "estimatedEffort": "string"
  },
  "risk": {
    "score": "number",
    "factors": []
  }
}
```

## Integration with Migration Processes

- **framework-upgrade**: Primary compatibility check
- **language-version-migration**: Version analysis

## Related Skills

- `codemod-executor`: Automated fixes
- `dependency-updater`: Dependency upgrades

## Related Agents

- `framework-upgrade-specialist`: Upgrade execution
