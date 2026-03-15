---
name: test-driven-development
description: Strict RED-GREEN-REFACTOR cycle enforcement. Tests are never skipped or deferred. Run mode only, never watch mode. Exit code evidence mandatory.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Test-Driven Development

## Overview

Enforces the TDD discipline in all CC10X BUILD workflows. The RED-GREEN-REFACTOR cycle is mandatory and cannot be skipped or deferred.

## TDD Cycle

1. **RED**: Write failing test first. Run with `CI=true npm test` or `--run` flag. Exit code MUST be 1.
2. **GREEN**: Write minimal code to make test pass. Exit code MUST be 0.
3. **REFACTOR**: Clean up implementation while keeping tests green. Exit code MUST remain 0.

## Non-Negotiable Rules

- Always use run mode (`CI=true npm test` or `--run` flag)
- NEVER use watch mode (prevents hanging processes)
- Use timeout guards (`timeout 60s`) as backup
- Record exit codes as evidence at each phase
- If tests fail 3 consecutive times in GREEN, report failure status
- Never skip RED phase (failing test must exist before implementation)
- Never defer tests to "later" -- TDD means tests first

## Scope Discipline

- If implementation requires >3 file changes, flag for scope review
- Architectural choices require user approval unless pre-approved in plan
- New dependencies require user approval

## When to Use

- Every feature implementation in BUILD workflow
- Every bug fix in DEBUG workflow (regression test)

## Agents Used

- `component-builder` (primary consumer)
- `bug-investigator` (regression tests)
