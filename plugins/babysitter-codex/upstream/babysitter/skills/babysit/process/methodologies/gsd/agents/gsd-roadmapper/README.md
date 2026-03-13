# GSD Roadmapper Agent

## Overview

The `gsd-roadmapper` agent creates project roadmaps with phased milestone breakdown and 100% requirement coverage. It translates requirements into ordered development phases grouped into milestones with dependency tracking and effort estimates.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Project Manager |
| **Guarantee** | 100% requirement coverage |
| **Philosophy** | "Every requirement must have a home" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Requirement Mapping** | 100% coverage with proof matrix |
| **Phase Design** | Atomic phases with single goals |
| **Milestone Grouping** | Deployable milestone boundaries |
| **Dependency Ordering** | Technical foundation-first ordering |
| **Critical Path** | Identify longest dependency chain |
| **Effort Estimation** | Small/Medium/Large per phase |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(roadmapperTask, {
  agentName: 'gsd-roadmapper',
  prompt: {
    role: 'Senior Project Manager',
    task: 'Create phased development roadmap from requirements',
    context: {
      projectFile: '.planning/PROJECT.md',
      requirementsFile: '.planning/REQUIREMENTS.md',
      researchSummary: '.planning/research/SUMMARY.md'
    },
    outputFormat: 'ROADMAP.md'
  }
});
```

### Direct Invocation

```bash
/agent gsd-roadmapper create \
  --project ".planning/PROJECT.md" \
  --requirements ".planning/REQUIREMENTS.md" \
  --research ".planning/research/SUMMARY.md" \
  --output ".planning/ROADMAP.md"
```

## ROADMAP.md Output Structure

```markdown
# Development Roadmap

## Milestone 1: MVP (v1.0)

### Phase 1: Project Setup & Core Models
- **Goal**: Initialize project with database schema and core data models
- **Requirements**: REQ-001, REQ-002
- **Dependencies**: None
- **Effort**: Small

### Phase 2: User Authentication
- **Goal**: Users can register, log in, and access protected resources
- **Requirements**: REQ-003, REQ-004
- **Dependencies**: Phase 1
- **Effort**: Medium

## Coverage Matrix
| Requirement | Phase(s) | Status |
|-------------|----------|--------|
| REQ-001 | Phase 1 | Covered |
| REQ-002 | Phase 1 | Covered |
| REQ-003 | Phase 2 | Covered |

## Critical Path
Phase 1 -> Phase 2 -> Phase 3 -> Phase 5
```

## Process Integration

| Process | Agent Role |
|---------|------------|
| `new-project.js` | Roadmap creation after requirements |

## Related Resources

- [gsd-research-synthesizer agent](../gsd-research-synthesizer/) -- Provides research summary input
- [gsd-planner agent](../gsd-planner/) -- Consumes roadmap for phase planning

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-008
**Category:** Planning
**Status:** Active
