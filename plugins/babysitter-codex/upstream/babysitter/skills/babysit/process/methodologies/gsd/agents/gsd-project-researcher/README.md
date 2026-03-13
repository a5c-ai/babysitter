# GSD Project Researcher Agent

## Overview

The `gsd-project-researcher` agent researches the domain ecosystem for a new project before roadmap creation. It runs as 4 parallel instances, each focused on a specific area: stack, features, architecture, or pitfalls.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Technology Consultant |
| **Scope** | Full project domain ecosystem |
| **Execution** | 4 parallel instances |
| **Philosophy** | "Understand the landscape before charting the course" |

## Expertise Areas

| Focus Area | Output File | Scope |
|------------|-------------|-------|
| **Stack** | STACK.md | Languages, frameworks, databases, hosting |
| **Features** | FEATURES.md | Implementation patterns, build vs buy, MVP |
| **Architecture** | ARCHITECTURE.md | Patterns, data flow, API design |
| **Pitfalls** | PITFALLS.md | Failure modes, security, scalability |

## Usage

### Within Babysitter Processes

```javascript
// Spawn 4 parallel instances
const [stack, features, arch, pitfalls] = await ctx.parallel.all([
  ctx.task(researchTask, { focusArea: 'stack', project: projectFile }),
  ctx.task(researchTask, { focusArea: 'features', project: projectFile }),
  ctx.task(researchTask, { focusArea: 'architecture', project: projectFile }),
  ctx.task(researchTask, { focusArea: 'pitfalls', project: projectFile })
]);
```

### Direct Invocation

```bash
# Research a specific area
/agent gsd-project-researcher research \
  --focus-area stack \
  --project ".planning/PROJECT.md" \
  --output ".planning/research/STACK.md"
```

## Common Tasks

### 1. New Project Research

During gsd:new-project, 4 instances run in parallel to research the full domain:
- Stack instance evaluates technology options
- Features instance maps feature patterns
- Architecture instance recommends structure
- Pitfalls instance identifies risks

### 2. New Milestone Research

Similar to new project but brownfield -- considers existing codebase.

## Process Integration

| Process | Agent Role |
|---------|------------|
| `new-project.js` | 4 parallel research instances |

## Output Format Example (STACK.md)

```markdown
# Stack Research: E-Commerce Platform

## Runtime & Language
| Option | Verdict | Rationale |
|--------|---------|-----------|
| Node.js + TypeScript | Recommended | Team expertise, ecosystem |
| Python + FastAPI | Alternative | Strong for data-heavy features |

## Framework
| Option | Verdict | Rationale |
|--------|---------|-----------|
| Next.js 15 | Recommended | SSR + API routes, strong ecosystem |
| Remix | Alternative | Better data loading, smaller community |

## Database
| Option | Verdict | Rationale |
|--------|---------|-----------|
| PostgreSQL | Recommended | Relational, proven at scale |
| MongoDB | Avoid | Schema-less adds complexity for e-commerce |

## Recommendation
Node.js + TypeScript with Next.js 15 and PostgreSQL.
```

## Related Resources

- [gsd-research-synthesizer agent](../gsd-research-synthesizer/) -- Consolidates parallel outputs
- [gsd-phase-researcher agent](../gsd-phase-researcher/) -- Phase-scoped research
- [gsd-roadmapper agent](../gsd-roadmapper/) -- Consumes research for roadmap

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-006
**Category:** Research
**Status:** Active
