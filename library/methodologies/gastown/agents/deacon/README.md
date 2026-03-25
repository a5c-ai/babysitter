# Deacon Agent

System supervisor agent adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Role

Daemon supervisor that monitors agent health, detects failures, and triggers automated recovery.

## Used By

- `gastown-patrol` process (primary patrol orchestrator)
- `patrol-monitoring` skill
- `session-management` skill (recovery actions)
