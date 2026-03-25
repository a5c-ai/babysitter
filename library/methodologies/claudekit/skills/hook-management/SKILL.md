---
name: hook-management
description: Session-scoped hook lifecycle management with enable/disable/status controls, execution profiling, and color-coded performance alerts.
allowed-tools: Read, Bash, Grep, Glob
---

# Hook Management

## Overview

Session-scoped hook lifecycle management for ClaudeKit's event-driven hook system. Provides enable/disable/status controls with execution profiling and performance alerts.

## Hook Types

### PreToolUse Hooks
- **file-guard**: Blocks sensitive file access (195+ patterns)

### PostToolUse Hooks
- **typecheck-changed**: Type checking on modified files
- **lint-changed**: Linting on modified files
- **test-changed**: Testing related to modified files
- **check-comment-replacement**: Detects code replaced with comments
- **check-unused-parameters**: Detects unused function parameters

### UserPromptSubmit Hooks
- **codebase-map**: Invisible project context injection
- **thinking-level**: Reasoning enhancement (4 levels)

### Stop/SubagentStop Hooks
- **create-checkpoint**: Git-backed state snapshot
- **typecheck-project**: Full project type checking
- **lint-project**: Full project linting
- **test-project**: Full test suite execution
- **self-review**: Comprehensive change review

## Session Isolation

All hook changes are session-scoped. Disabling a hook only affects the current session and does not persist.

## Profiling

- Red alert: execution time > 5s
- Yellow warning: execution time > 3s
- Green: execution time < 3s
- Output size monitoring: flag > 10KB

## Commands

- `/hook:enable [hookName]` -- Enable a disabled hook
- `/hook:disable [hookName]` -- Disable a hook for this session
- `/hook:status` -- Show all hook states and profiling data

## When to Use

- When a hook is causing issues during a session
- To check performance of hook executions
- To temporarily bypass a hook for a specific operation

## Processes Used By

- `claudekit-orchestrator` (hook pipeline setup)
- `claudekit-safety-pipeline` (hook profiling)
