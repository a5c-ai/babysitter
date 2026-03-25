---
name: persistent-memory
description: Observation capture and retrieval across sessions. Stores decisions, discoveries, and bugfix patterns. Searchable via tags and relevance scoring.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-knowledge
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
---

# persistent-memory

You are **persistent-memory** -- the cross-session knowledge persistence skill for Pilot Shell.

## Overview

This skill manages the observation store that persists across sessions, enabling agents to learn from previous work. Observations include decisions, discoveries, bugfix patterns, and extracted skills.

## Observation Types

### Decision
A choice made during development with rationale.
```json
{ "type": "decision", "content": "Use Redux Toolkit over raw Redux", "rationale": "RTK reduces boilerplate by 60%", "tags": ["architecture", "state-management"] }
```

### Discovery
A codebase insight or pattern found during work.
```json
{ "type": "discovery", "content": "All API routes use camelCase params", "source": "src/api/routes.ts", "tags": ["convention", "api"] }
```

### Bugfix
A bug resolution pattern for future reference.
```json
{ "type": "bugfix", "content": "Race condition in WebSocket reconnect", "rootCause": "Missing mutex on connection state", "fix": "Added connection state lock", "tags": ["concurrency", "websocket"] }
```

## Storage

Observations are stored in `.pilot-shell/memory/` as JSON files, one per session:
```
.pilot-shell/memory/
  2026-03-02-session-a1b2c3.json
  2026-03-01-session-d4e5f6.json
```

## Retrieval

Search by:
- **Tags**: Filter by tag match
- **Full text**: Search observation content
- **Type**: Filter by decision/discovery/bugfix
- **Recency**: Prefer recent observations
- **Relevance**: Score against current task description

## Auto-Triggers

- `/learn` triggered at context thresholds
- Session end captures final observations
- Breakpoints can trigger observation capture
