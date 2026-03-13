# Legacy Code Interpreter Skill

## Overview

The Legacy Code Interpreter skill helps understand undocumented legacy code. It extracts business logic, characterizes behavior, and creates documentation from code analysis.

## Quick Start

### Prerequisites

- Access to legacy codebase
- Code analysis tools
- Documentation templates

### Basic Usage

1. **Identify target code**
   - Focus on critical paths
   - Start with entry points
   - Follow data flows

2. **Analyze behavior**
   - Trace execution paths
   - Document business rules
   - Identify side effects

3. **Generate documentation**
   - Create pseudo-code summaries
   - Document edge cases
   - Map dependencies

## Features

### Analysis Techniques

| Technique | Purpose | Output |
|-----------|---------|--------|
| Control Flow | Execution paths | Flow diagrams |
| Data Flow | Value tracking | Transformation maps |
| Slice Analysis | Focused analysis | Code subsets |
| Pattern Matching | Known idioms | Pattern catalog |

### Documentation Output

- Business rule catalog
- Pseudo-code summaries
- State machine diagrams
- Data flow maps

## Configuration

```json
{
  "analysisDepth": "comprehensive",
  "outputFormats": ["markdown", "diagrams"],
  "focusAreas": ["business-logic", "data-flow"],
  "documentationTemplate": "standard"
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Working Effectively with Legacy Code](https://www.oreilly.com/library/view/working-effectively-with/0131177052/)
