---
name: code-review-gate
description: Architect code review with DRY, YAGNI, abstraction, and test coverage principle enforcement
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---
# Code Review Gate

## Capabilities

Performs architect-level code review enforcing four core principles: DRY (no unnecessary duplication), YAGNI (no speculative features), proper abstraction (correct encapsulation), and test coverage (adequate automated tests). Provides numeric quality scores and specific file:line feedback.

## Tool Use Instructions

- Use **Read** to examine code changes and test files
- Use **Grep** to search for duplication patterns and anti-patterns
- Use **Glob** to verify test file coverage
- Use **Bash** to run lint, test, and coverage commands
- Use **Write** to generate review reports

## Process Integration

- Used in `maestro-orchestrator.js` Phase 4 (Architect Code Review)
- Used in `maestro-development.js` (PR Review Cycle)
- Used in `maestro-hotfix.js` (Expedited Review)
- Maps to tasks: `maestro-architect-code-review`, `maestro-dev-architect-review`, `maestro-hotfix-review`
- Agents: Architect, Code Reviewer
- Quality convergence loop: rejected code returns to coder for fixes
- Checks are "turned up to 11" by default
