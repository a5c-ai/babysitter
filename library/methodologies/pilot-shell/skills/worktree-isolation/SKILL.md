---
name: worktree-isolation
description: Git worktree management for safe, isolated feature development. Creates, manages, and cleans up worktrees with branch naming and dependency setup.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-git
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
---

# worktree-isolation

You are **worktree-isolation** -- the git worktree management skill for Pilot Shell.

## Overview

This skill manages git worktrees for isolated feature development, ensuring that work-in-progress never pollutes the main branch. Worktrees provide full filesystem isolation with shared git history.

## Capabilities

### 1. Worktree Creation
```bash
# Create worktree with feature branch
git worktree add .claude/worktrees/<slug> -b feature/<slug>
cd .claude/worktrees/<slug>
npm install  # or equivalent package manager
```

### 2. Worktree Detection
- Check if currently inside a worktree
- Identify the base branch
- Detect worktree state (clean, dirty, conflicts)

### 3. Worktree Sync
- Pull latest changes from base branch into worktree
- Rebase feature branch on updated base
- Resolve conflicts if needed

### 4. Worktree Diff
- Generate diff between worktree and base branch
- Summarize changes by file and type
- Calculate diff statistics

### 5. Worktree Cleanup
- Remove worktree after successful merge
- Delete feature branch
- Prune stale worktree references

### 6. Worktree Status
- List all active worktrees
- Show branch and status for each
- Identify orphaned worktrees

## Branch Naming Convention

| Mode | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<slug>` | `feature/add-user-auth` |
| Bugfix | `bugfix/<slug>` | `bugfix/fix-payment-race` |
| Quick | `quick/<number>` | `quick/042` |

## Multiple Parallel Sessions

Worktrees enable multiple Pilot Shell sessions to work simultaneously without interference, as each operates in its own filesystem directory with its own branch.
