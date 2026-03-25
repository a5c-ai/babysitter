# GSD Research Synthesizer Agent

## Overview

The `gsd-research-synthesizer` agent consolidates outputs from 4 parallel gsd-project-researcher instances into a unified SUMMARY.md. It identifies cross-cutting themes, detects conflicts, ranks recommendations, and produces an actionable synthesis for downstream requirements and roadmap creation.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Technical Writer and Analyst |
| **Input** | STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md |
| **Output** | SUMMARY.md |
| **Philosophy** | "Connect the parts to exceed the sum" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Multi-Document Synthesis** | Theme extraction across 4 research documents |
| **Conflict Detection** | Surface contradictions between recommendations |
| **Priority Ranking** | Impact + confidence-based recommendation ordering |
| **Executive Summary** | 200-400 word overview for quick consumption |
| **Action Items** | DECIDE/ADOPT/AVOID/INVESTIGATE categorization |

## Usage

### Within Babysitter Processes

```javascript
const summary = await ctx.task(synthesizerTask, {
  agentName: 'gsd-research-synthesizer',
  prompt: {
    role: 'Technical Writer and Analyst',
    task: 'Synthesize parallel research outputs into SUMMARY.md',
    context: {
      stackFile: '.planning/research/STACK.md',
      featuresFile: '.planning/research/FEATURES.md',
      architectureFile: '.planning/research/ARCHITECTURE.md',
      pitfallsFile: '.planning/research/PITFALLS.md',
      projectFile: '.planning/PROJECT.md'
    },
    outputFormat: 'SUMMARY.md'
  }
});
```

### Direct Invocation

```bash
/agent gsd-research-synthesizer synthesize \
  --research-dir ".planning/research/" \
  --output ".planning/research/SUMMARY.md"
```

## SUMMARY.md Output Structure

```markdown
# Research Summary

## Executive Summary
Next.js + TypeScript + PostgreSQL stack recommended for this
e-commerce platform. Key risk: authentication complexity.
Two decisions needed before planning.

## Cross-Cutting Themes
1. **Type Safety** (STACK, FEATURES) -- TypeScript recommended
2. **Scale Concerns** (ARCHITECTURE, PITFALLS) -- Start simple, plan for growth

## Conflicts
### Database Choice
- STACK recommends MongoDB (flexibility)
- ARCHITECTURE recommends PostgreSQL (relational integrity)
- **Resolution**: PostgreSQL -- e-commerce data is inherently relational

## Ranked Recommendations
1. [High Impact] Adopt Next.js for SSR + API routes
2. [High Impact] Use PostgreSQL with Prisma ORM
3. [Medium Impact] Implement JWT auth with refresh tokens

## Action Items
- DECIDE: Hosting provider (Vercel vs self-hosted)
- ADOPT: TypeScript strict mode
- AVOID: Microservices at current team size
- INVESTIGATE: Payment processor options before Phase 3
```

## Process Integration

| Process | Agent Role |
|---------|------------|
| `new-project.js` | Post-research synthesis |

## Related Resources

- [gsd-project-researcher agent](../gsd-project-researcher/) -- Produces source documents
- [gsd-roadmapper agent](../gsd-roadmapper/) -- Consumes SUMMARY.md for roadmap

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-007
**Category:** Research
**Status:** Active
