---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code. Enforces RED-GREEN-REFACTOR cycle.
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you did not watch the test fail, you do not know if it tests the right thing.

## The Iron Law

NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

Write code before the test? Delete it. Start over. No exceptions.

## RED-GREEN-REFACTOR

1. **RED** - Write one failing test showing desired behavior
2. **Verify RED** - Run test, confirm it fails for the right reason
3. **GREEN** - Write simplest code to pass (YAGNI)
4. **Verify GREEN** - Run test + full suite, all must pass
5. **REFACTOR** - Clean up while keeping tests green
6. **COMMIT** - Frequent small commits

## Red Flags (STOP and Start Over)

- Code before test
- Test passes immediately
- "I'll test after"
- "Too simple to test"
- Rationalizing "just this once"

## Agents Used

- Process agents defined in `test-driven-development.js`

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/test-driven-development`
