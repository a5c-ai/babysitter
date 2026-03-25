---
name: code-smell-detector
description: Automated detection of code smells and anti-patterns to identify refactoring opportunities
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Code Smell Detector Skill

Automated detection of code smells, anti-patterns, and design issues that indicate deeper problems in the codebase. This skill identifies refactoring opportunities and prioritizes them by impact.

## Purpose

Enable systematic detection of code smells for:
- Refactoring prioritization
- Technical debt identification
- Code quality improvement
- Migration preparation
- Design pattern violations

## Capabilities

### 1. Long Method Detection
- Identify methods exceeding line thresholds
- Analyze parameter counts
- Detect high cyclomatic complexity
- Suggest extraction candidates

### 2. Large Class Identification
- Detect classes with too many responsibilities
- Identify god classes
- Analyze class cohesion
- Suggest decomposition strategies

### 3. Feature Envy Analysis
- Find methods using other classes' data excessively
- Identify misplaced functionality
- Suggest method relocation
- Map cross-class dependencies

### 4. Primitive Obsession Detection
- Identify overuse of primitives
- Find missing value objects
- Detect stringly-typed code
- Suggest domain type extraction

### 5. Parallel Inheritance Hierarchy
- Detect mirrored class hierarchies
- Identify inheritance coupling
- Suggest hierarchy consolidation
- Map inheritance relationships

### 6. Shotgun Surgery Detection
- Identify changes requiring multiple file edits
- Detect scattered functionality
- Map change propagation patterns
- Suggest consolidation points

### 7. God Class Identification
- Detect classes doing too much
- Analyze responsibility distribution
- Calculate lack of cohesion metrics
- Suggest single responsibility refactoring

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| SonarQube | Code smell detection | MCP Server / API |
| PMD | Java smell detection | CLI |
| IntelliJ IDEA | IDE-based analysis | CLI / Export |
| Designite | Design smell detection | CLI |
| ast-grep | Pattern-based detection | MCP Server / CLI |
| ESLint | JavaScript smell rules | CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "target": {
    "path": "string",
    "filesAnalyzed": "number"
  },
  "smells": [
    {
      "type": "string",
      "severity": "high|medium|low",
      "file": "string",
      "line": "number",
      "element": "string",
      "description": "string",
      "metrics": {},
      "refactoringSuggestion": "string",
      "estimatedEffort": "string"
    }
  ],
  "summary": {
    "totalSmells": "number",
    "byType": {},
    "bySeverity": {},
    "hotspots": []
  }
}
```

## Integration with Migration Processes

- **code-refactoring**: Primary smell identification
- **technical-debt-remediation**: Debt quantification
- **legacy-codebase-assessment**: Quality assessment

## Related Skills

- `static-code-analyzer`: Broader quality analysis
- `refactoring-assistant`: Smell remediation
- `dead-code-eliminator`: Unused code removal

## Related Agents

- `code-transformation-executor`: Executes refactorings
- `technical-debt-auditor`: Prioritizes debt remediation
