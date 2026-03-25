---
name: dead-code-eliminator
description: Identify and safely remove dead, unused, and unreachable code from codebases
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Dead Code Eliminator Skill

Identifies and safely removes dead code, unused functions, unreachable code paths, and orphaned files from codebases to reduce complexity and maintenance burden.

## Purpose

Enable safe dead code removal for:
- Codebase simplification
- Migration preparation
- Technical debt reduction
- Build size optimization
- Maintenance cost reduction

## Capabilities

### 1. Unused Function Detection
- Find uncalled functions
- Identify unused exports
- Detect unreferenced methods
- Map call graphs

### 2. Unreachable Code Identification
- Analyze control flow
- Find code after returns
- Detect impossible conditions
- Identify dead branches

### 3. Unused Variable Detection
- Find unread variables
- Identify write-only variables
- Detect unused parameters
- Flag shadowed variables

### 4. Orphan File Detection
- Find unimported modules
- Identify orphaned assets
- Detect unused configuration
- Map file dependencies

### 5. Safe Removal Verification
- Verify no runtime references
- Check dynamic imports
- Validate reflection usage
- Test after removal

### 6. Impact Analysis
- Estimate removal scope
- Calculate size reduction
- Assess risk level
- Document dependencies

## Tool Integrations

| Tool | Language | Integration Method |
|------|----------|-------------------|
| ts-prune | TypeScript | CLI |
| unimported | JavaScript | CLI |
| deadcode | Python | CLI |
| UCDetector | Java | Eclipse Plugin |
| unused | Rust | CLI |
| deadcode | Go | CLI |
| webpack-bundle-analyzer | JavaScript | CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "deadCode": {
    "functions": [
      {
        "file": "string",
        "name": "string",
        "line": "number",
        "confidence": "high|medium|low",
        "reason": "string"
      }
    ],
    "variables": [],
    "files": [],
    "unreachable": []
  },
  "impact": {
    "filesAffected": "number",
    "linesRemovable": "number",
    "estimatedSizeReduction": "string"
  },
  "risks": [],
  "recommendations": []
}
```

## Integration with Migration Processes

- **code-refactoring**: Pre-refactoring cleanup
- **legacy-decommissioning**: Feature removal
- **monolith-to-microservices**: Service extraction prep

## Related Skills

- `static-code-analyzer`: Combined analysis
- `code-smell-detector`: Related smell detection

## Related Agents

- `legacy-decommissioning-specialist`: Uses for cleanup
- `code-transformation-executor`: Executes removal
