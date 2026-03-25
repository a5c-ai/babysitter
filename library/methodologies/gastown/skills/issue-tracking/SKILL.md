---
name: issue-tracking
description: Track beads as git-backed issues with persistent attribution, supporting Gas Town's bead lifecycle and convoy progress monitoring.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Issue Tracking

## Overview

Track work through Gas Town's bead system: git-backed atomic work units that carry persistent attribution. Each bead is an issue/task with full lifecycle tracking from creation through completion.

## When to Use

- Creating new beads for a convoy
- Tracking bead progress and status
- Managing bead dependencies
- Collecting attribution data for agent evaluation

## Bead Lifecycle

1. **Created**: Bead defined with scope and acceptance criteria
2. **Assigned**: Bead placed on agent's hook
3. **In Progress**: Agent actively working (GUPP enforced)
4. **Review**: Work complete, awaiting merge review
5. **Done**: Merged and verified (`gt done`)
6. **Destroyed**: Wisps only - cleaned up after landing

## Attribution

All work carries persistent attribution:
- Which agent completed the bead
- Time taken and quality score
- Used for A/B testing agent configurations
- Feeds into agent evaluation and scoring

## Tool Use

Used within convoy management and orchestrator processes.
