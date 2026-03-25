---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session. Dispatches fresh subagent per task.
---

# Subagent-Driven Development

## Overview

Execute plan by dispatching fresh subagent per task with two-stage review: spec compliance first, then code quality.

**Core principle:** Fresh subagent per task + two-stage review = high quality, fast iteration.

## When to Use

- Have implementation plan with mostly independent tasks
- Want to stay in current session
- Want automatic review checkpoints

## Two-Stage Review

1. **Spec Compliance** - Did they build what was requested? (nothing more, nothing less)
2. **Code Quality** - Is it well-built? (clean, tested, maintainable)

Spec MUST pass before quality review begins.

## Red Flags

- Never skip either review stage
- Never proceed with unfixed issues
- Never dispatch multiple implementation subagents in parallel
- Never let implementer self-review replace actual review

## Agents Used

- `agents/implementer/` - Fresh subagent per task
- `agents/spec-reviewer/` - Verifies spec compliance
- `agents/code-quality-reviewer/` - Verifies code quality
- `agents/code-reviewer/` - Final review of entire implementation

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/subagent-driven-development`
