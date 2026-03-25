---
name: state-management
description: STATE.md reading, writing, and field-level updates. Provides cross-session state persistence via .planning/STATE.md with structured fields for current task, completed phases, blockers, decisions, and quick tasks.
allowed-tools: Read Write Edit Glob
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-002
---

# state-management

You are **state-management** - the skill responsible for all STATE.md CRUD operations within the GSD methodology. STATE.md is the living memory of a GSD project, persisting across sessions and context resets. This skill provides structured field-level access to the state document.

## Overview

STATE.md is the single source of truth for project progress within GSD. It tracks:
- What is currently being worked on (`current_task`, `current_phase`)
- What has been completed (`completed_phases`)
- What is blocking progress (`blockers`)
- What decisions have been made (`decisions`)
- Quick task status (`quick_tasks` table)
- Session metadata (`last_updated`, `session_count`)

This skill corresponds to the original `lib/state.cjs` module in the GSD system. Every GSD process reads STATE.md at startup and writes updates at completion.

## Capabilities

### 1. Read Full State

Parse STATE.md into structured fields:

```markdown
---
last_updated: 2026-03-02T14:30:00Z
session_count: 12
current_milestone: v1.0
---

# Project State

## Current Work
- **Phase**: 72
- **Task**: Implement OAuth2 login flow
- **Status**: executing
- **Plan**: PLAN-1.md (task 3 of 5)

## Completed Phases
- [x] Phase 70: Project setup and scaffolding
- [x] Phase 71: Database schema and migrations

## Blockers
- [ ] [HIGH] API key for OAuth provider not configured (@user, 2026-03-01)

## Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-28 | Use PostgreSQL over SQLite | Need concurrent writes for API |
| 2026-03-01 | Skip Phase 71.1 (Redis cache) | Not needed for v1.0 |

## Quick Tasks
| # | Task | Status | Date |
|---|------|--------|------|
| 001 | Fix login redirect | done | 2026-02-28 |
| 002 | Add rate limiting | in-progress | 2026-03-02 |
```

### 2. Update Individual Fields

Update a single field without affecting the rest of the document:

```
update current_phase -> 73
update current_task -> "Build API endpoints for user management"
update status -> "planning"
```

Use `Edit` tool to perform surgical updates on specific lines.

### 3. Append to List Fields

Add items to list-type fields:

```
append completed_phases -> "Phase 72: OAuth2 authentication"
append decisions -> { date: "2026-03-02", decision: "Use JWT tokens", rationale: "Stateless auth for API" }
append blockers -> { severity: "MEDIUM", description: "Need design mockups", owner: "@designer" }
```

### 4. Remove from List Fields

Remove items when resolved:

```
remove blocker -> "API key for OAuth provider not configured"
```

Mark blockers as resolved rather than deleting (change `[ ]` to `[x]`).

### 5. Quick Tasks Table Management

Add, update, and query quick tasks:

```
add_quick_task -> { number: 3, task: "Update README", status: "pending" }
update_quick_task -> { number: 2, status: "done" }
query_quick_tasks -> { status: "in-progress" }
```

### 6. Cross-Session Memory

STATE.md persists across context resets. On session start:
1. Read STATE.md to restore project context
2. Increment `session_count` in frontmatter
3. Update `last_updated` timestamp
4. Report state summary to orchestrator

### 7. Decision Log

Structured decision tracking with timestamps and rationale:

```markdown
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-02 | Use JWT tokens | Stateless auth for API |
```

### 8. Blocker Tracking

Track blockers with severity and ownership:

```markdown
- [ ] [HIGH] API key not configured (@user, 2026-03-01)
- [x] [MEDIUM] Design mockups needed (@designer, 2026-02-28) - resolved 2026-03-01
```

Severity levels: `HIGH` (blocks current work), `MEDIUM` (blocks future work), `LOW` (inconvenience).

## Tool Use Instructions

### Reading State
1. Use `Read` to load `.planning/STATE.md`
2. Parse frontmatter for metadata (last_updated, session_count, current_milestone)
3. Parse markdown sections into structured fields
4. Return parsed state object

### Updating a Field
1. Use `Read` to load current STATE.md
2. Locate the target field/section
3. Use `Edit` with precise old_string/new_string to update only the target
4. Verify edit succeeded by reading the section back

### Appending to Lists
1. Use `Read` to find the end of the target list section
2. Use `Edit` to insert new item at the correct position
3. For tables, append new row before the section break

### Resolving Blockers
1. Use `Read` to find the blocker text
2. Use `Edit` to change `- [ ]` to `- [x]` and append resolution date

## Process Integration

This skill is used by most GSD processes:

- `execute-phase.js` - Update current_task as each task completes, track position
- `verify-work.js` - Add/resolve blockers based on verification results
- `audit-milestone.js` - Read completed_phases for coverage analysis
- `progress.js` - Read full state for progress display and routing
- `quick.js` - Add/update quick tasks table
- `debug.js` - Track debug sessions, add blockers for unresolved issues
- `complete-milestone.js` - Clear completed_phases, reset current_task
- `add-tests.js` - Update state with test coverage info

## Output Format

```json
{
  "operation": "read|update|append|remove",
  "field": "current_phase|completed_phases|blockers|decisions|quick_tasks",
  "status": "success|error",
  "previousValue": "...",
  "newValue": "...",
  "stateSnapshot": {
    "currentPhase": 72,
    "currentTask": "Implement OAuth2",
    "completedPhases": [70, 71],
    "activeBlockers": 1,
    "quickTasksTotal": 3,
    "quickTasksPending": 1
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `stateFile` | `.planning/STATE.md` | Path to STATE.md |
| `autoTimestamp` | `true` | Auto-update last_updated on write |
| `autoSessionCount` | `true` | Auto-increment session_count on read |
| `blockerSeverityLevels` | `HIGH,MEDIUM,LOW` | Valid blocker severities |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `STATE.md not found` | Planning directory not initialized | Run gsd-tools init first |
| `Section not found` | Unexpected STATE.md format | Rebuild STATE.md from template |
| `Edit collision` | Non-unique text match for edit | Provide more context in old_string |
| `Frontmatter parse error` | Malformed YAML frontmatter | Fix YAML syntax or regenerate |
| `Concurrent modification` | Multiple processes editing state | STATE.md is not lock-protected; serialize access |

## Constraints

- STATE.md must remain human-readable markdown at all times
- Never delete historical entries (blockers, decisions); mark as resolved instead
- Frontmatter must be valid YAML
- Quick task numbers must be sequential
- All timestamps must be ISO 8601 format
- Decision log must be append-only (no editing past decisions)
- Blocker resolution must preserve the original blocker text
