# Refinery Agent

Merge queue processor adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Role

Collects agent work, resolves conflicts, and merges in dependency order with integration verification.

## Used By

- `gastown-merge-queue` process (primary merge processor)
- `merge-queue` skill
- `gastown-orchestrator` process (merge-review step)
