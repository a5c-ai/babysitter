---
name: agent-coordination
description: Coordinate Crew (persistent) and Polecat (transient) agents using Gas Town's hook-based work distribution and GUPP principle.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Managing agent handoffs
- Nudging stuck agents
- Coordinating Crew and Polecat workers
- Setting up hook hierarchies

## Agent Types

- **Crew**: Long-lived, named agents for persistent collaboration
- **Polecats**: Transient workers with persistent identity but ephemeral sessions
- **Dogs**: Deacon helpers for infrastructure tasks

## Hook Hierarchy

Three-tier hook system (base -> role -> rig+role):
1. **Base hooks**: Apply to all agents
2. **Role hooks**: Apply to agents in a specific role
3. **Rig+Role hooks**: Apply to agents on a specific rig in a specific role

## Key Commands

- `gt agents` - List available agents
- `gt feed` - Feed work to an agent's hook
- `gt handoff` - Hand off work between agents
- `gt nudge` - Nudge a stuck agent
- `gt seance` - Revive a dead agent session

## Tool Use

Invoke via babysitter process: `methodologies/gastown/gastown-orchestrator` (assign-workers step)
