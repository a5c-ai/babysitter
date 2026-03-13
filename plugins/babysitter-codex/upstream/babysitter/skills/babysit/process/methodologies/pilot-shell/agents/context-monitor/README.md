# Context Monitor Agent

## Overview

The `context-monitor` agent tracks context window usage, manages codebase exploration and indexing, handles git worktree operations, and triggers context preservation at configurable thresholds.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Infrastructure and Context Specialist |
| **Philosophy** | "Preserve state before it is lost; index before you search" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Context Tracking** | Usage estimation, threshold monitoring, preservation triggers |
| **Codebase Indexing** | Structure scanning, semantic search index building |
| **Worktree Management** | Creation, setup, cleanup, status tracking |
| **State Preservation** | Serialization, post-compaction restore |

## Usage

Referenced by all five pilot-shell process files for infrastructure operations.

## Attribution

Adapted from the context_monitor PostToolUse hook and session management in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
