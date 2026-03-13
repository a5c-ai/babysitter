---
name: context-preservation
description: State capture and restore across context window compactions. Monitors usage thresholds and serializes quality, task, and spec state for seamless continuation.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-infrastructure
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
---

# context-preservation

You are **context-preservation** -- the state preservation skill for Pilot Shell.

## Overview

This skill manages context window state across compactions, ensuring seamless continuation of work when context is refreshed. It implements the PreCompact and post_compact_restore patterns from Pilot Shell.

## Capabilities

### 1. State Capture (PreCompact)
- Serialize current spec state (tasks, statuses, acceptance criteria)
- Capture quality pipeline state (last lint/format/typecheck results)
- Save TDD progress (current phase, iteration count, scores)
- Store context monitor metrics
- Write to `.pilot-shell/state.json`

### 2. State Restore (SessionStart / post_compact_restore)
- Read `.pilot-shell/state.json` on session start
- Restore spec task tracking state
- Restore quality baseline
- Resume TDD from last known position
- Log restoration summary

### 3. Threshold Monitoring
- Track context usage percentage (default threshold: 70%)
- Trigger preservation when threshold approached
- Calculate optimal preservation timing

## State Schema

```json
{
  "version": "1.0.0",
  "timestamp": "2026-03-02T12:00:00Z",
  "spec": {
    "title": "...",
    "taskStatuses": [{ "id": "...", "status": "COMPLETE" }],
    "currentPhase": "implement"
  },
  "quality": {
    "lastScore": 87,
    "lint": { "passed": true },
    "format": { "passed": true },
    "typecheck": { "passed": true }
  },
  "tdd": {
    "iteration": 2,
    "score": 92,
    "compliant": true
  },
  "context": {
    "usagePercent": 72,
    "preservedAt": "2026-03-02T12:00:00Z"
  }
}
```
