---
name: codemod-executor
description: Execute automated AST-based code transformations for large-scale refactoring and migration
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Codemod Executor Skill

Executes automated code transformations using AST-based tools for large-scale refactoring, framework migrations, and language version upgrades.

## Purpose

Enable automated code transformations for:
- Framework migration (React, Angular, Vue)
- Language version upgrades
- API deprecation handling
- Pattern standardization
- Large-scale refactoring

## Capabilities

### 1. AST-Based Transformations
- Parse source code to AST
- Apply transformation rules
- Generate modified source
- Preserve code style

### 2. Pattern Matching and Replacement
- Define source patterns
- Specify target patterns
- Handle edge cases
- Support wildcards and captures

### 3. Multi-File Transformations
- Apply across entire codebase
- Handle import updates
- Coordinate cross-file changes
- Manage side effects

### 4. Dry-Run Preview
- Preview changes before applying
- Generate diff reports
- Estimate impact scope
- Identify risky transformations

### 5. Rollback Support
- Create transformation checkpoints
- Enable selective rollback
- Track applied codemods
- Maintain change history

### 6. Custom Codemod Creation
- Define new transformation rules
- Test codemods in isolation
- Document transformation logic
- Share across teams

## Tool Integrations

| Tool | Language | Integration Method |
|------|----------|-------------------|
| jscodeshift | JavaScript/TypeScript | CLI |
| ts-morph | TypeScript | Library |
| Rector | PHP | CLI |
| Scalafix | Scala | CLI |
| OpenRewrite | Java | CLI / Maven |
| Bowler | Python | CLI |
| ast-grep | Multi-language | CLI / MCP |
| gofmt -r | Go | CLI |

## Output Schema

```json
{
  "executionId": "string",
  "timestamp": "ISO8601",
  "codemod": {
    "name": "string",
    "version": "string",
    "description": "string"
  },
  "results": {
    "filesProcessed": "number",
    "filesModified": "number",
    "filesSkipped": "number",
    "transformations": "number"
  },
  "changes": [
    {
      "file": "string",
      "transformations": [
        {
          "type": "string",
          "line": "number",
          "before": "string",
          "after": "string"
        }
      ]
    }
  ],
  "errors": [],
  "warnings": []
}
```

## Integration with Migration Processes

- **code-refactoring**: Large-scale refactoring
- **framework-upgrade**: Framework migrations
- **language-version-migration**: Syntax upgrades
- **code-translation**: Language conversion assist

## Related Skills

- `refactoring-assistant`: Suggests transformations
- `static-code-analyzer`: Pre-transformation analysis

## Related Agents

- `code-transformation-executor`: Orchestrates codemods
- `framework-upgrade-specialist`: Framework-specific codemods
