---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies.
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Multiple subsystems broken independently
- Each problem understood without context from others
- No shared state between investigations

## When NOT to Use

- Failures are related (fix one might fix others)
- Need full system state understanding
- Agents would interfere (editing same files)

## Process

1. Identify independent domains
2. Dispatch agents in parallel (ctx.parallel.all)
3. Check for conflicts between solutions
4. Run full test suite to verify integration

## Agents Used

- Process agents defined in `dispatching-parallel-agents.js`

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/dispatching-parallel-agents`
