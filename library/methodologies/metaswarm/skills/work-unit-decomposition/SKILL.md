---
name: work-unit-decomposition
description: Decompose implementation plans into discrete work units with enumerated DoD items, file scope declarations, dependency mapping, and human checkpoint flags.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When decomposing a large feature into implementable chunks
- When preparing for orchestrated execution

## Work Unit Structure

Each work unit specifies:
- **ID** - Unique identifier
- **Title** - Human-readable description
- **Definition of Done** - Enumerated checklist items
- **File Scope** - Which files the unit may modify
- **Dependencies** - Other work units this depends on
- **Human Checkpoint** - Whether human approval is needed before execution
- **Parallel Safe** - Whether it can execute alongside other units

## Human Checkpoint Triggers

Mark human checkpoints for:
- Schema or database changes
- Security-sensitive code paths
- New architectural patterns not seen in codebase
- External API integrations
- Breaking changes to public interfaces

## Agents Used

- `agents/architect/` - Creates the decomposition
- `agents/cto/` - Validates TDD readiness per unit

## Tool Use

Invoke as part of: `methodologies/metaswarm/metaswarm-orchestrator` (Phase 4)
