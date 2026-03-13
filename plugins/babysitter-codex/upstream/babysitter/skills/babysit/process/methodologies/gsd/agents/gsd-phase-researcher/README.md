# GSD Phase Researcher Agent

## Overview

The `gsd-phase-researcher` agent researches how to implement a specific phase before planning begins. It investigates implementation approaches, evaluates libraries and tools, assesses risks, and produces a structured RESEARCH.md that the gsd-planner can directly consume.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Software Engineer -- Research Specialist |
| **Scope** | Phase-specific research |
| **Philosophy** | "Research before planning prevents expensive course corrections" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Approach Comparison** | 2-3 approaches with trade-off analysis |
| **Library Evaluation** | Compatibility, community health, docs, types |
| **Risk Assessment** | Technical, integration, performance, external |
| **Best Practices** | Domain-specific patterns and anti-patterns |
| **Open Questions** | Identification of decisions needing human input |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(researcherTask, {
  agentName: 'gsd-phase-researcher',
  prompt: {
    role: 'Senior Software Engineer - Research Specialist',
    task: 'Research phase implementation approaches',
    context: {
      phase: 3,
      phaseGoal: 'Implement user authentication with JWT',
      projectFile: '.planning/PROJECT.md',
      roadmapFile: '.planning/ROADMAP.md'
    },
    outputFormat: 'RESEARCH.md'
  }
});
```

### Direct Invocation

```bash
# Research a phase
/agent gsd-phase-researcher research \
  --phase 3 \
  --project ".planning/PROJECT.md"

# Standalone research
/agent gsd-phase-researcher research \
  --phase 3 \
  --output ".planning/phases/03-RESEARCH.md"
```

## RESEARCH.md Output Structure

```markdown
# Phase 3 Research: User Authentication

## Approach A: JWT with passport.js
- **Pros**: Mature ecosystem, many strategies
- **Cons**: Heavy dependency, complex configuration
- **Libraries**: passport (0.7.0), passport-jwt (4.0.1)
- **Risk**: Medium (configuration complexity)

## Approach B: Custom JWT middleware
- **Pros**: Lightweight, full control
- **Cons**: More code to maintain, edge cases
- **Libraries**: jsonwebtoken (9.0.2)
- **Risk**: Low-Medium (well-understood pattern)

## Recommendation
Approach B -- Custom JWT middleware. Fits project constraints
(minimal dependencies) and team expertise.

## Library Evaluation
| Library | Version | Verdict | Rationale |
|---------|---------|---------|-----------|
| jsonwebtoken | 9.0.2 | Use | Standard, TypeScript types |
| bcryptjs | 2.4.3 | Use | Pure JS, no native deps |

## Risks
1. Token refresh strategy needs design (Medium impact)
2. CORS configuration for auth headers (Low impact)

## Open Questions
1. Should refresh tokens be stored in httpOnly cookies or localStorage?
2. What is the desired token expiry duration?
```

## Process Integration

| Process | Agent Role |
|---------|------------|
| `plan-phase.js` | Pre-planning research (default flow) |
| `research-phase.js` | Standalone research process |

## Related Resources

- [gsd-planner agent](../gsd-planner/) -- Consumes RESEARCH.md for planning
- [gsd-project-researcher agent](../gsd-project-researcher/) -- Broader project-level research

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-005
**Category:** Research
**Status:** Active
