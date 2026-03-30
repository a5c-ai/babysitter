# GSD Codebase Mapper Agent

## Overview

The `gsd-codebase-mapper` agent explores an existing codebase and produces structured analysis documents. It runs as 4 parallel instances with distinct focus areas, producing 7 documents total that comprehensively describe the codebase.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Architect -- Codebase Analyst |
| **Execution** | 4 parallel instances |
| **Output** | 7 structured documents in .planning/codebase/ |
| **Philosophy** | "Map what exists before planning what comes next" |

## Focus Areas

| Instance | Documents | Scope |
|----------|-----------|-------|
| **tech** | STACK.md, INTEGRATIONS.md | Dependencies, services, APIs |
| **arch** | ARCHITECTURE.md, STRUCTURE.md | Patterns, layers, file organization |
| **quality** | CONVENTIONS.md, TESTING.md | Code style, test coverage, CI/CD |
| **concerns** | CONCERNS.md | Tech debt, TODOs, vulnerabilities |

## Usage

### Within Babysitter Processes

```javascript
// Spawn 4 parallel mapper instances
const results = await ctx.parallel.all([
  ctx.task(mapperTask, { focusArea: 'tech', codebasePath: '.' }),
  ctx.task(mapperTask, { focusArea: 'arch', codebasePath: '.' }),
  ctx.task(mapperTask, { focusArea: 'quality', codebasePath: '.' }),
  ctx.task(mapperTask, { focusArea: 'concerns', codebasePath: '.' })
]);
```

### Direct Invocation

```bash
# Map a specific focus area
/agent gsd-codebase-mapper map \
  --focus-area tech \
  --output-dir ".planning/codebase/"

# Map specific subdirectory
/agent gsd-codebase-mapper map \
  --focus-area arch \
  --scope "src/" \
  --output-dir ".planning/codebase/"
```

## Common Tasks

### 1. Full Codebase Mapping

During gsd:map-codebase, 4 instances analyze the codebase in parallel:
- tech: reads package manifests, config files, API clients
- arch: maps directory structure, entry points, data flow
- quality: examines code style, test patterns, CI/CD
- concerns: searches for TODOs, deprecated usage, debt

### 2. Targeted Mapping

Map a specific area of the codebase for phase-specific context.

## Output Example (STACK.md)

```markdown
# Technology Stack

## Runtime
- **Node.js** v20.x (from .nvmrc)
- **TypeScript** 5.3.3 (from tsconfig.json)

## Framework
- **Express** 4.18.2 (src/server.ts:3)
- Custom middleware pattern (src/middleware/)

## Database
- **PostgreSQL** via Prisma 5.7.0 (prisma/schema.prisma)
- 12 models, 47 fields

## Dependencies (key)
| Package | Version | Purpose | File |
|---------|---------|---------|------|
| express | 4.18.2 | HTTP server | src/server.ts |
| prisma | 5.7.0 | ORM | prisma/schema.prisma |
| jsonwebtoken | 9.0.2 | Auth tokens | src/middleware/auth.ts |
```

## Process Integration

| Process | Agent Role |
|---------|------------|
| `map-codebase.js` | 4 parallel codebase analysis instances |

## Related Resources

- [gsd-phase-researcher agent](../gsd-phase-researcher/) -- Uses codebase docs for research
- [gsd-planner agent](../gsd-planner/) -- Uses codebase docs for planning context

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-009
**Category:** Analysis
**Status:** Active
