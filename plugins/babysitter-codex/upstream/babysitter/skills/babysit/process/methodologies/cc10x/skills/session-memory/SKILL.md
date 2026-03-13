---
name: session-memory
description: Mandatory memory persistence system across session resets using three markdown surfaces in .claude/cc10x/. Iron law - every workflow must load at start and update at end.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Session Memory

## Overview

Persistent memory system that survives Claude Code's message compaction. Uses three markdown files in `.claude/cc10x/` as a permission-free database for continuity, consistency, and pattern compounding.

## Memory Surfaces

1. **activeContext.md** -- Current focus, decisions, learnings, next steps, blockers
2. **patterns.md** -- Project conventions, architecture decisions, common gotchas, reusable solutions
3. **progress.md** -- Task completion tracking with verification evidence

## Iron Law

EVERY WORKFLOW MUST:
1. LOAD memory at START (and before key decisions)
2. UPDATE memory at END (and after learnings/decisions)

## Stable Edit Anchors

Safe section headers for Edit operations:
- activeContext: `## Recent Changes`, `## Learnings`, `## References`
- patterns: `## Common Gotchas`, `## Project SKILL_HINTS`
- progress: `## Completed`, `## Verification`

## Read-Edit-Verify Pattern

1. Read file
2. Verify anchor exists
3. Edit with exact `old_string`
4. Read back to confirm

## Tool Rules

- Use `Write()` for NEW files (permission-free)
- Use `Edit()` for EXISTING files (permission-free)
- Never use `Write()` to overwrite existing files
- Never compound commands (`mkdir && cat`)

## When to Use

- At the start of every CC10X workflow (load)
- At the end of every CC10X workflow (update)
- Before making key decisions (check patterns)
- After discovering learnings or gotchas (persist)

## Agents Used

All CC10X agents use this skill. The cc10x-router manages load/update lifecycle.
