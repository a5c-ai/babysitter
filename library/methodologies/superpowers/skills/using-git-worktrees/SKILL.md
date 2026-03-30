---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans.
---

# Using Git Worktrees

## Overview

Create isolated workspaces sharing the same repository. Systematic directory selection + safety verification.

**Core principle:** Isolated workspace before implementation.

## Process

1. Check existing directories (.worktrees/ or worktrees/)
2. Verify directory is gitignored
3. Create worktree with new branch
4. Run project setup (auto-detect npm/cargo/pip/go)
5. Verify clean test baseline
6. Report ready

## Safety

- Always verify worktree directory is gitignored
- Always run baseline tests
- Report failures before proceeding

## Agents Used

- Process agents referenced in `superpowers-workflow.js`

## Tool Use

Referenced by `executing-plans` and `subagent-driven-development` processes.
