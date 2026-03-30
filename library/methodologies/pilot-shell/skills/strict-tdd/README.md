# Strict TDD Skill

## Overview

Enforces strict RED->GREEN->REFACTOR test-driven development discipline with compliance scoring and git history verification.

## The Three Laws

1. No production code without a failing test
2. Only enough test to fail
3. Only enough code to pass

## TDD Cycle

| Phase | Action | Commit Pattern |
|-------|--------|---------------|
| RED | Write failing test | `test: add failing test for [criterion]` |
| GREEN | Minimum implementation | `feat: implement [criterion]` |
| REFACTOR | Clean up, tests stay green | `refactor: clean up [area]` |

## Attribution

Adapted from the testing rule and tdd_enforcer hook in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
