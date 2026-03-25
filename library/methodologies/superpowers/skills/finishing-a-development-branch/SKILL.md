---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work.
---

# Finishing a Development Branch

## Overview

Verify tests, present structured options, execute chosen workflow, clean up.

**Core principle:** Verify tests -> Present options -> Execute choice -> Clean up.

## Options

1. Merge back to base branch locally
2. Push and create a Pull Request
3. Keep the branch as-is
4. Discard this work (requires typed confirmation)

## Process

1. Verify all tests pass (STOP if they fail)
2. Determine base branch
3. Present exactly 4 options
4. Execute chosen option
5. Clean up worktree (Options 1 and 4 only)

## Agents Used

- Process agents referenced in workflow processes

## Tool Use

Referenced by `executing-plans` and `subagent-driven-development` processes.
