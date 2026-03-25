---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints between batches.
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for human review between batches. Supports resume via `.tasks.json` persistence.

**Core principle:** Batch execution with checkpoints for architect review.

## When to Use

- You have a written implementation plan on disk
- Executing in a separate/parallel session
- Want human checkpoints between task batches

## Process

1. Load persisted tasks (resume support)
2. Verify/setup worktree
3. Execute tasks in batches (default 3)
4. Report after each batch, wait for feedback
5. Finish branch after all tasks complete

## Agents Used

- Process agents defined in `executing-plans.js`
- References `using-git-worktrees` for workspace isolation
- References `finishing-a-development-branch` for completion

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/executing-plans`
