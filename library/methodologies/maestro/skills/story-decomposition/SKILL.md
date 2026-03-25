---
name: story-decomposition
description: Break technical specifications into small, implementable stories with dependency ordering
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---
# Story Decomposition

## Capabilities

Breaks technical specifications into small, independently implementable stories. Establishes dependency ordering, estimates effort, and creates a dispatching queue for parallel coder execution.

## Tool Use Instructions

- Use **Read** to examine the technical specification and existing code
- Use **Grep/Glob** to find existing modules and interfaces that stories will touch
- Use **Write** to generate story definitions
- Use **Edit** to refine stories based on feedback

## Process Integration

- Used in `maestro-orchestrator.js` Phase 3 (Story Decomposition)
- Used in `maestro-development.js` (Story Prioritization)
- Maps to tasks: `maestro-architect-story-decomp`, `maestro-dev-prioritize`
- Agent: Architect
- Each story should be completable by a single coder in one batch
- Outputs feed into parallel coder dispatch
