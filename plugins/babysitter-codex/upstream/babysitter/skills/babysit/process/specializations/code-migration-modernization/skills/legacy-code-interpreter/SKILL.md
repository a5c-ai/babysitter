---
name: legacy-code-interpreter
description: Understand and document legacy code behavior through deep analysis and behavior characterization
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Legacy Code Interpreter Skill

Deep analysis and interpretation of legacy code to understand undocumented behavior, extract business logic, and characterize system functionality.

## Purpose

Enable legacy code understanding for:
- Business logic extraction
- Undocumented feature discovery
- Behavior characterization
- Migration planning
- Knowledge preservation

## Capabilities

### 1. Business Logic Extraction
- Parse conditional logic
- Extract calculation formulas
- Identify validation rules
- Document decision trees

### 2. Undocumented Feature Discovery
- Find hidden functionality
- Identify feature flags
- Discover Easter eggs
- Map admin features

### 3. Control Flow Analysis
- Trace execution paths
- Map state machines
- Identify loops and recursion
- Document entry points

### 4. Data Flow Tracking
- Trace data transformations
- Map input to output
- Identify side effects
- Document state changes

### 5. Side Effect Identification
- Find external calls
- Identify I/O operations
- Map database operations
- Document messaging

### 6. Behavior Characterization
- Create behavior summaries
- Generate pseudo-code
- Document edge cases
- Map error handling

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Understand (SciTools) | Deep analysis | CLI / API |
| Lattix | Architecture analysis | CLI |
| CodeScene | Behavioral analysis | API |
| Sourcetrail | Code exploration | CLI |
| ast-grep | Pattern matching | MCP / CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "interpretation": {
    "businessLogic": [
      {
        "name": "string",
        "location": "string",
        "description": "string",
        "pseudoCode": "string",
        "inputs": [],
        "outputs": [],
        "sideEffects": []
      }
    ],
    "controlFlow": {
      "entryPoints": [],
      "stateMachines": [],
      "criticalPaths": []
    },
    "dataFlow": {
      "transformations": [],
      "stateChanges": []
    },
    "undocumented": []
  }
}
```

## Integration with Migration Processes

- **legacy-codebase-assessment**: Primary interpretation tool
- **migration-planning-roadmap**: Knowledge source

## Related Skills

- `static-code-analyzer`: Structural analysis
- `knowledge-extractor`: Documentation mining

## Related Agents

- `legacy-system-archaeologist`: Uses for excavation
