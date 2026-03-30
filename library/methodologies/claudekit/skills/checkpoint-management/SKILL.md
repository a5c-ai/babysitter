---
name: checkpoint-management
description: Git-backed state management for safe rollback. Create and restore checkpoints with tagged commits and metadata tracking.
allowed-tools: Read, Bash, Grep, Glob
---

# Checkpoint Management

## Overview

Git-backed checkpoint system providing safe rollback points during development sessions. Each checkpoint creates a tagged commit with descriptive metadata for easy identification and restoration.

## Operations

### Create Checkpoint
- Stage all current changes
- Create commit with [CHECKPOINT] prefix
- Tag with claudekit-checkpoint-{timestamp}
- Record metadata: files changed, insertions, deletions

### Restore Checkpoint
- List available checkpoints by tag
- Preview changes that would be reverted
- Restore to selected checkpoint via git reset
- Verify restored state matches checkpoint

## Session Isolation

Checkpoints are session-scoped. Tags created during a session can be cleaned up without affecting other work.

## When to Use

- Before risky refactoring operations
- After passing quality checks (safety checkpoints)
- At the start and end of ClaudeKit sessions
- Before spec execution phases

## Processes Used By

- `claudekit-orchestrator` (session start/end checkpoints)
- `claudekit-safety-pipeline` (safety checkpoints after quality checks)
