---
name: work-decomposition
description: Decompose goals into MEOWs (Molecular Expressions of Work) - trackable atomic units following Gas Town's bead-based work model.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When a goal is too large for a single agent
- When parallel execution would benefit progress
- When work needs tracked attribution

## Process

1. **Analyze** the goal and project context
2. **Identify** natural seams for decomposition
3. **Create MEOWs** with clear boundaries and dependencies
4. **Classify** as beads (persistent) or wisps (ephemeral)
5. **Map dependencies** between MEOWs
6. **Estimate** effort and assign priorities

## Decomposition Principles

- Each MEOW should be completable by a single agent
- Dependencies should form a DAG (no cycles)
- Prefer more smaller beads over fewer larger ones
- Wisps for throwaway work (scaffolding, exploration)
- Every MEOW gets attribution tracking

## Tool Use

Invoke via babysitter process: `methodologies/gastown/gastown-orchestrator` (analyze-work step)
