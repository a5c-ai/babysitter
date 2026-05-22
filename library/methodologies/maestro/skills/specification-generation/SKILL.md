---
name: specification-generation
description: Convert requirements into structured technical specifications with architecture decisions
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

# Specification Generation

## Capabilities

Transforms requirements from PM interviews into structured technical specifications. Includes technology stack selection, system architecture, data models, API contracts, and architecture decision records (ADRs).

## Tool Use Instructions

- Use **Read** to examine requirements documents and existing specs
- Use **Grep/Glob** to find related architectural patterns in the codebase
- Use **Write** to generate the technical specification document
- Use **Edit** to refine specs based on Architect feedback

## Process Integration

- Used in `maestro-orchestrator.js` Phase 2-3 (Architect Review, Tech Spec)
- Maps to tasks: `maestro-pm-spec-generation`, `maestro-architect-tech-spec`
- Agents: Product Manager (requirements spec), Architect (technical spec)
- Iterates with Architect feedback loop until approved
- Outputs feed into `story-decomposition` skill
