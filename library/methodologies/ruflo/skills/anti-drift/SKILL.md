---
name: anti-drift
description: Hierarchical coordination and drift detection with frequent checkpoints, shared memory coherence validation, role specialization enforcement, and short task cycles.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Tasks with high risk of scope creep
- When multiple agents work on related subtasks
- Critical tasks where deviation is costly

## Anti-Drift Mechanisms

1. **Hierarchical Coordinator** - Queen agent validates alignment at checkpoints
2. **Frequent Checkpoints** - Every 2 subtasks (configurable)
3. **Shared Memory Coherence** - Validate all agents see consistent state
4. **Short Task Cycles** - Bounded execution windows prevent runaway agents
5. **Role Specialization** - Agents stay within their assigned scope

## Drift Scoring

- `0.0-0.1`: Fully aligned, no intervention needed
- `0.1-0.3`: Minor drift, automatic correction
- `0.3-0.5`: Significant drift, checkpoint correction with logging
- `0.5+`: Critical drift, human escalation via breakpoint

## Agents Used

- `agents/swarm-coordinator/` - Drift detection and correction
- `agents/tactical-queen/` - Checkpoint enforcement
- `agents/adaptive-queen/` - Real-time course correction

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-swarm-coordination`
