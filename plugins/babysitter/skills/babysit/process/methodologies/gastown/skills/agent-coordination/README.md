# Agent Coordination Skill

Multi-agent coordination adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Purpose

Assign work to agents, manage handoffs, and enforce GUPP through hook-based work distribution.

## Process Flow

1. Identify available agents (Crew, Polecats)
2. Match beads to agent capabilities
3. Feed work to agent hooks
4. Monitor agent progress
5. Handle handoffs and nudges

## Integration

- **Input from:** `convoy-management` or Mayor orchestrator
- **Output to:** Agent execution, `patrol-monitoring` for oversight
- **Process file:** `../../gastown-orchestrator.js` (assign-workers task)
