---
name: refactoring-assistant
description: Suggest and guide application of refactoring patterns to improve code quality
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Refactoring Assistant Skill

Suggests appropriate refactoring patterns and guides their application to improve code quality, maintainability, and migration readiness.

## Purpose

Enable guided refactoring for:
- Code quality improvement
- Design pattern application
- Migration preparation
- Technical debt reduction
- Maintainability enhancement

## Capabilities

### 1. Extract Method/Class Suggestions
- Identify extraction candidates
- Suggest method boundaries
- Recommend class decomposition
- Guide interface extraction

### 2. Move Method Recommendations
- Detect misplaced methods
- Suggest target classes
- Analyze dependencies
- Guide safe relocation

### 3. Rename Refactoring
- Suggest meaningful names
- Propagate renames safely
- Handle cross-references
- Update documentation

### 4. Inline Refactoring
- Identify inline candidates
- Remove unnecessary indirection
- Simplify call chains
- Reduce complexity

### 5. Pull Up/Push Down Member
- Analyze inheritance hierarchies
- Suggest member movement
- Optimize class hierarchies
- Improve polymorphism

### 6. Design Pattern Application
- Recognize pattern opportunities
- Guide pattern implementation
- Suggest appropriate patterns
- Validate pattern application

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| IDE Refactoring | Automated refactoring | CLI / API |
| Sourcery | AI-powered suggestions | CLI |
| Sourcegraph Cody | Code intelligence | API |
| IntelliJ IDEA | Java refactoring | CLI |
| VS Code | Multi-language | Extension API |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "suggestions": [
    {
      "type": "extract-method|move-method|rename|inline|design-pattern",
      "priority": "high|medium|low",
      "target": {
        "file": "string",
        "element": "string",
        "line": "number"
      },
      "description": "string",
      "rationale": "string",
      "steps": ["string"],
      "estimatedImpact": {
        "complexity": "string",
        "maintainability": "string",
        "testability": "string"
      },
      "risks": ["string"]
    }
  ],
  "patterns": {
    "applicable": ["string"],
    "opportunities": []
  }
}
```

## Integration with Migration Processes

- **code-refactoring**: Primary refactoring guidance
- **technical-debt-remediation**: Debt reduction strategies

## Related Skills

- `code-smell-detector`: Identifies refactoring needs
- `codemod-executor`: Automates refactorings

## Related Agents

- `code-transformation-executor`: Executes suggested refactorings
