---
name: convoy-management
description: Create, track, and land convoys of related beads as primary work orders in the Gas Town multi-agent orchestration framework.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Convoy Management

## Overview

Manage the full lifecycle of Gas Town convoys: creation from a goal, bead decomposition, agent assignment, progress tracking, and landing (merge). Convoys are the primary work-order unit wrapping related beads.

## When to Use

- Starting a new multi-agent work effort
- Coordinating parallel bead execution across agents
- Tracking progress of distributed work
- Landing (merging) completed convoy results

## Process

1. **Create convoy** from goal or MEOW decomposition
2. **Decompose** into beads (persistent) and wisps (ephemeral)
3. **Assign** beads to Crew (long-lived) or Polecats (transient)
4. **Track** progress via hooks and heartbeats
5. **Verify** all beads complete with quality checks
6. **Land** convoy by merging bead branches

## Key Concepts

- **Convoy**: Primary work-order wrapping related beads
- **Bead**: Git-backed atomic work unit (issue/task)
- **Wisp**: Ephemeral bead destroyed after successful run
- **GUPP**: If there is work on your Hook, YOU MUST RUN IT

## Agents Used

- `agents/mayor/` - Creates and coordinates convoys
- `agents/crew-lead/` - Persistent collaborator on beads
- `agents/polecat/` - Transient worker for individual beads

## Tool Use

Invoke via babysitter process: `methodologies/gastown/gastown-convoy`
