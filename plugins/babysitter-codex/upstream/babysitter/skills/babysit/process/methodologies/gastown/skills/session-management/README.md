# Session Management Skill

Agent session lifecycle management adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Purpose

Initialize, handoff, revive, and manage agent sessions with persistent identity.

## Session Types

- Crew (long-lived), Polecat (ephemeral body, persistent identity), Dog (infrastructure)

## Integration

- **Input from:** `agent-coordination` and `patrol-monitoring`
- **Output to:** Active agent sessions, recovery actions
- **Process file:** Used across gastown orchestrator and patrol processes
