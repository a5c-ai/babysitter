---
name: session-management
description: Manage agent sessions including initialization, handoffs, revival (seance), and persistent identity for Polecats and Crew agents.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Session Management

## Overview

Manage agent sessions in Gas Town: initialize new sessions, handle handoffs between agents, revive dead sessions (seance), and maintain persistent identity across ephemeral Polecat sessions.

## When to Use

- Initializing new agent sessions
- Handing off work between agents
- Reviving a dead or stuck agent session
- Managing Polecat identity persistence across sessions

## Session Operations

1. **Init**: Start new session with role and hook setup
2. **Attach**: Connect agent to Mayor for coordination
3. **Handoff**: Transfer work between agents with context
4. **Seance**: Revive a dead agent's session state
5. **Resume**: Continue from last checkpoint

## Agent Session Types

- **Crew**: Long-lived sessions, full state persistence
- **Polecat**: Ephemeral sessions, persistent identity, state via hooks
- **Dog**: Infrastructure sessions, minimal state

## Key Commands

- `gt mayor attach` - Attach to Mayor coordination
- `gt handoff` - Hand off work to another agent
- `gt seance` - Revive dead session
- `gt prime` - Prime agent with context

## Tool Use

Used within agent coordination and patrol monitoring processes.
