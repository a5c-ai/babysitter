# Witness Agent

Per-rig lifecycle manager adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Role

Oversees worker agents on a specific rig, managing sessions, local state, and rig-level coordination.

## Used By

- `gastown-patrol` process (per-rig health monitoring)
- `session-management` skill
- `agent-coordination` skill
