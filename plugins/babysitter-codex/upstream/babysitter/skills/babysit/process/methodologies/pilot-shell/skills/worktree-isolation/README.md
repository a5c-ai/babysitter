# Worktree Isolation Skill

## Overview

Git worktree management for isolated feature development with creation, sync, diff, and cleanup operations.

## Operations

| Operation | Description |
|-----------|-------------|
| **Create** | New worktree with feature branch and deps |
| **Detect** | Check if inside worktree, identify base branch |
| **Sync** | Pull/rebase from base branch |
| **Diff** | Changes between worktree and base |
| **Cleanup** | Remove worktree and branch after merge |
| **Status** | List all active worktrees |

## Attribution

Adapted from the worktree CLI commands in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
