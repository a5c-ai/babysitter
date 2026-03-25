---
name: strict-tdd
description: Strict RED->GREEN->REFACTOR test-driven development with enforcement. Never write production code before a failing test. Atomic commits per TDD cycle.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-core
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
---

# strict-tdd

You are **strict-tdd** -- the test-driven development enforcement skill for Pilot Shell.

## Overview

This skill enforces strict RED->GREEN->REFACTOR discipline across all implementations. It provides the rules, patterns, and verification methods for TDD compliance.

## The Three Laws of TDD (Pilot Shell Strict Mode)

1. **You may not write production code until you have a failing test**
2. **You may not write more of a test than is sufficient to fail**
3. **You may not write more production code than is sufficient to pass**

## TDD Cycle

### RED Phase
1. Write a test that captures exactly one acceptance criterion
2. Run the test -- it MUST fail
3. Verify it fails for the RIGHT reason (not a syntax error)
4. Commit: `test: add failing test for [criterion]`

### GREEN Phase
1. Write the MINIMUM code to make the test pass
2. Run the test -- it MUST pass
3. Verify only the target test turned green (no side effects)
4. Commit: `feat: implement [criterion]`

### REFACTOR Phase
1. Clean up code while keeping ALL tests green
2. Remove duplication, improve naming, extract methods
3. Run full test suite -- ALL tests MUST pass
4. Commit: `refactor: clean up [area]`

## Compliance Scoring

| Score | Meaning |
|-------|---------|
| 90-100 | Exemplary TDD: all cycles followed correctly |
| 70-89 | Good TDD: minor deviations |
| 50-69 | Partial TDD: some implementation before tests |
| 0-49 | TDD violation: significant implementation without tests |

## Verification Methods

1. **Git History Analysis**: Test files must appear in commits before implementation files
2. **Coverage Analysis**: New code must have >90% test coverage
3. **Commit Message Convention**: RED/GREEN/REFACTOR phases identifiable in messages
