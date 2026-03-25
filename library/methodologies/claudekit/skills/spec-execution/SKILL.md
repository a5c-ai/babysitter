---
name: spec-execution
description: 6-phase iterative specification execution workflow covering implementation, testing, review, improvement, commit, and progress tracking with quality-gated convergence.
allowed-tools: Read, Bash, Grep, Glob
---

# Spec Execution

## Overview

Executes a feature specification through 6 iterative phases with quality-gated convergence. Each phase builds on the previous, with improvement cycles triggered when quality falls below threshold.

## Six Phases

### Phase 1: Implementation
- Read specification for requirements and architecture
- Implement each requirement following project conventions
- Add type definitions and JSDoc documentation
- Implement error handling for all failure modes

### Phase 2: Test Writing
- Write unit tests for each module/function
- Write integration tests for API boundaries
- Cover all acceptance criteria from the specification
- Test edge cases and error paths

### Phase 3: Code Review
- Verify all requirements are implemented
- Check acceptance criteria are tested
- Review architecture adherence
- Assess code quality

### Phase 4: Iterative Improvement
- Address review findings
- Fix failing tests
- Resolve architecture deviations
- Re-verify quality (convergence loop, max 3 cycles)

### Phase 5: Atomic Commit
- Group changes into logical atomic commits
- Descriptive messages following project conventions
- Separate production, test, and config changes
- Include specification reference

### Phase 6: Progress Tracking
- Requirement completion percentage
- Test coverage summary
- Quality score report
- Remaining work identification

## Quality Gate

Quality threshold defaults to 80. If not met after max improvement cycles, a human breakpoint is triggered for review.

## When to Use

- `/spec:execute [file]` slash command
- After spec creation when ready to implement

## Processes Used By

- `claudekit-spec-workflow` (execute mode)
