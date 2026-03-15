---
name: architecture-analyzer
description: Analyze and visualize software architecture patterns, dependencies, and module boundaries for migration planning
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Architecture Analyzer Skill

Analyzes and visualizes software architecture patterns and dependencies to support migration planning, module boundary identification, and architectural decision-making.

## Purpose

Enable comprehensive architecture analysis for:
- Component dependency mapping
- Layered architecture detection
- Coupling and cohesion metrics
- Architectural violation detection
- Module boundary identification
- Dependency graph generation

## Capabilities

### 1. Component Dependency Mapping
- Extract dependencies between modules/packages
- Map inter-service communications
- Identify external system integrations
- Track data flow between components
- Generate dependency matrices

### 2. Layered Architecture Detection
- Identify architectural layers (presentation, business, data)
- Detect layer violations
- Map cross-cutting concerns
- Analyze layer dependencies
- Validate architectural patterns

### 3. Coupling/Cohesion Metrics
- Calculate afferent coupling (Ca)
- Calculate efferent coupling (Ce)
- Compute instability index (I = Ce / (Ca + Ce))
- Measure module cohesion
- Identify highly coupled components

### 4. Architectural Violation Detection
- Detect circular dependencies between modules
- Identify layer bypassing
- Find direct database access from UI layers
- Check for proper abstraction usage
- Validate dependency rules

### 5. Module Boundary Identification
- Detect logical module groupings
- Identify bounded contexts
- Map shared kernel areas
- Analyze module interfaces
- Suggest decomposition boundaries

### 6. Dependency Graph Generation
- Generate DOT format graphs
- Create Mermaid diagrams
- Export to PlantUML
- Produce interactive visualizations
- Support multiple granularity levels

## Tool Integrations

This skill can leverage the following external tools when available:

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Structure101 | Architecture visualization | Export analysis |
| Lattix | Dependency analysis | CLI / API |
| NDepend | .NET architecture analysis | CLI |
| JDepend | Java package dependencies | CLI |
| Madge | JavaScript/TypeScript | CLI |
| deptree | Python dependencies | CLI |
| go-arch-lint | Go architecture | CLI |
| ast-grep | Pattern matching | MCP Server |

## Usage

### Basic Analysis

```bash
# Invoke skill for architecture analysis
# The skill will analyze structure and dependencies

# Expected inputs:
# - targetPath: Path to codebase root
# - analysisDepth: 'module' | 'package' | 'class' | 'function'
# - outputFormat: 'json' | 'dot' | 'mermaid' | 'plantuml'
# - includeMetrics: boolean
```

### Analysis Workflow

1. **Discovery Phase**
   - Identify project structure
   - Detect build configuration
   - Map source directories

2. **Extraction Phase**
   - Parse import/require statements
   - Extract module dependencies
   - Identify external dependencies

3. **Analysis Phase**
   - Calculate coupling metrics
   - Detect architectural patterns
   - Identify violations
   - Map boundaries

4. **Visualization Phase**
   - Generate dependency graphs
   - Create architecture diagrams
   - Produce metric reports

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "target": {
    "path": "string",
    "language": "string",
    "moduleCount": "number",
    "totalFiles": "number"
  },
  "architecture": {
    "pattern": "string (layered|modular|monolithic|microservices)",
    "layers": [
      {
        "name": "string",
        "modules": ["string"],
        "allowedDependencies": ["string"]
      }
    ],
    "boundedContexts": [
      {
        "name": "string",
        "modules": ["string"],
        "interfaces": ["string"]
      }
    ]
  },
  "modules": [
    {
      "name": "string",
      "path": "string",
      "files": "number",
      "linesOfCode": "number",
      "dependencies": ["string"],
      "dependents": ["string"],
      "metrics": {
        "afferentCoupling": "number",
        "efferentCoupling": "number",
        "instability": "number",
        "cohesion": "number"
      }
    }
  ],
  "dependencies": [
    {
      "from": "string",
      "to": "string",
      "type": "import|call|inherit|implement",
      "count": "number"
    }
  ],
  "violations": [
    {
      "type": "circular|layer-bypass|abstraction-leak",
      "severity": "high|medium|low",
      "from": "string",
      "to": "string",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "metrics": {
    "averageCoupling": "number",
    "maxCoupling": "number",
    "cyclomaticComplexity": "number",
    "circularDependencies": "number",
    "layerViolations": "number"
  },
  "graphs": {
    "dot": "string (file path)",
    "mermaid": "string (file path)",
    "plantuml": "string (file path)"
  }
}
```

## Integration with Migration Processes

This skill integrates with the following Code Migration/Modernization processes:

- **legacy-codebase-assessment**: Architecture understanding
- **monolith-to-microservices**: Service boundary identification
- **migration-planning-roadmap**: Dependency-based planning
- **code-refactoring**: Coupling reduction targets

## Configuration

### Skill Configuration File

Create `.architecture-analyzer.json` in the project root:

```json
{
  "analysisDepth": "module",
  "excludePaths": [
    "node_modules",
    "vendor",
    "dist",
    "build",
    ".git",
    "__tests__"
  ],
  "modulePatterns": {
    "javascript": "src/*",
    "java": "src/main/java/**",
    "python": "src/*"
  },
  "layers": {
    "enabled": true,
    "definitions": [
      {
        "name": "presentation",
        "patterns": ["**/ui/**", "**/views/**", "**/controllers/**"],
        "allowedDependencies": ["business", "shared"]
      },
      {
        "name": "business",
        "patterns": ["**/services/**", "**/domain/**"],
        "allowedDependencies": ["data", "shared"]
      },
      {
        "name": "data",
        "patterns": ["**/repositories/**", "**/dao/**"],
        "allowedDependencies": ["shared"]
      },
      {
        "name": "shared",
        "patterns": ["**/common/**", "**/utils/**"],
        "allowedDependencies": []
      }
    ]
  },
  "rules": {
    "maxCoupling": 10,
    "maxModuleSize": 5000,
    "forbiddenDependencies": [
      {"from": "presentation", "to": "data"}
    ]
  },
  "visualization": {
    "formats": ["mermaid", "dot"],
    "groupBy": "layer",
    "showMetrics": true
  }
}
```

## MCP Server Integration

When ast-grep MCP Server is available for pattern detection:

```javascript
// Example architecture pattern detection
{
  "tool": "ast_grep_search",
  "arguments": {
    "pattern": "import { $_ } from '../data/$_'",
    "language": "typescript",
    "path": "./src/ui"
  }
}
```

## Architectural Patterns

### Layered Architecture

```
┌─────────────────────────────────┐
│      Presentation Layer         │
│  (UI, Controllers, Views)       │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│       Business Layer            │
│  (Services, Domain, Logic)      │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│         Data Layer              │
│  (Repositories, DAOs, ORM)      │
└─────────────────────────────────┘
```

### Modular Monolith

```
┌─────────────────────────────────────────────┐
│              Application Shell               │
├───────────┬───────────┬───────────┬─────────┤
│  Module A │  Module B │  Module C │ Shared  │
│  ┌─────┐  │  ┌─────┐  │  ┌─────┐  │ ┌─────┐ │
│  │ UI  │  │  │ UI  │  │  │ UI  │  │ │Utils│ │
│  ├─────┤  │  ├─────┤  │  ├─────┤  │ └─────┘ │
│  │Logic│  │  │Logic│  │  │Logic│  │         │
│  ├─────┤  │  ├─────┤  │  ├─────┤  │         │
│  │Data │  │  │Data │  │  │Data │  │         │
│  └─────┘  │  └─────┘  │  └─────┘  │         │
└───────────┴───────────┴───────────┴─────────┘
```

### Microservices (Target)

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│Service A│  │Service B│  │Service C│
│  ┌───┐  │  │  ┌───┐  │  │  ┌───┐  │
│  │API│  │  │  │API│  │  │  │API│  │
│  └─┬─┘  │  │  └─┬─┘  │  │  └─┬─┘  │
│    │    │  │    │    │  │    │    │
│  ┌─▼─┐  │  │  ┌─▼─┐  │  │  ┌─▼─┐  │
│  │DB │  │  │  │DB │  │  │  │DB │  │
│  └───┘  │  │  └───┘  │  │  └───┘  │
└─────────┘  └─────────┘  └─────────┘
      │            │            │
      └────────────┼────────────┘
                   │
            ┌──────▼──────┐
            │  Event Bus  │
            └─────────────┘
```

## Metrics Reference

### Coupling Metrics

| Metric | Formula | Good | Warning | Bad |
|--------|---------|------|---------|-----|
| Afferent Coupling (Ca) | Incoming dependencies | < 10 | 10-20 | > 20 |
| Efferent Coupling (Ce) | Outgoing dependencies | < 10 | 10-20 | > 20 |
| Instability (I) | Ce / (Ca + Ce) | 0-0.3 or 0.7-1.0 | 0.3-0.7 | - |
| Abstractness (A) | Abstract classes / Total | Context dependent | - | - |

### Distance from Main Sequence

D = |A + I - 1|

- D = 0: Ideal (on the main sequence)
- D > 0.3: Warning
- D > 0.5: Problematic

## Best Practices

1. **Regular Analysis**: Run architecture analysis as part of CI/CD
2. **Define Boundaries**: Explicitly define module and layer boundaries
3. **Enforce Rules**: Use architectural fitness functions
4. **Document Decisions**: Use ADRs for architectural changes
5. **Track Metrics**: Monitor coupling trends over time
6. **Visualize**: Keep architecture diagrams up to date

## Related Skills

- `static-code-analyzer`: Code-level analysis
- `domain-model-extractor`: DDD boundary identification
- `technical-debt-quantifier`: Architecture debt assessment

## Related Agents

- `legacy-system-archaeologist`: Uses this skill for architecture discovery
- `microservices-decomposer`: Uses this skill for boundary identification
- `ddd-analyst`: Uses this skill for context mapping
- `migration-readiness-assessor`: Uses this skill for architecture evaluation

## References

- [Structure101](https://structure101.com/)
- [Lattix](https://www.lattix.com/)
- [NDepend](https://www.ndepend.com/)
- [Madge](https://github.com/pahen/madge)
- [C4 Model](https://c4model.com/)
- [Architecture Decision Records](https://adr.github.io/)
