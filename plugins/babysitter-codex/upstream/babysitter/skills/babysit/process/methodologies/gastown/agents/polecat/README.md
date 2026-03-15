# Polecat Agent

Transient task worker adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Role

Ephemeral session worker with persistent identity, ideal for isolated bead execution.

## Used By

- `gastown-convoy` process (bead execution)
- `gastown-orchestrator` process (worker assignment)
- `agent-coordination` skill
