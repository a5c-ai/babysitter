---
name: behavior-contract
description: Bug condition/postcondition formalization as testable Behavior Contracts. Defines invariants that must be preserved across fixes.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-bugfix
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
---

# behavior-contract

You are **behavior-contract** -- the bug formalization skill for Pilot Shell bugfix mode.

## Overview

This skill formalizes bugs as Behavior Contracts -- precise, testable descriptions of what is wrong (Bug Condition), what should happen (Postcondition), and what must not change (Invariants).

## Contract Structure

### Bug Condition
The exact input, state, or sequence that triggers the bug. Must be specific enough to write a failing test.

**Example**: "When `processPayment()` receives an amount of exactly $0.00, it throws an unhandled TypeError instead of returning a zero-amount receipt."

### Postcondition
The correct behavior that must hold after the fix is applied.

**Example**: "When `processPayment()` receives $0.00, it returns a valid Receipt object with `amount: 0` and `status: 'completed'`."

### Invariants
Existing correct behaviors that must be preserved by the fix.

**Example**:
- "Positive amounts still process correctly"
- "Negative amounts still throw `InvalidAmountError`"
- "Receipt format remains unchanged for all amount types"

## Contract Document Template

```markdown
# Behavior Contract: [Bug Title]

## Bug Condition
[Precise description of triggering conditions]

## Postcondition
[Expected correct behavior after fix]

## Invariants
- [ ] Invariant 1: [existing behavior to preserve]
- [ ] Invariant 2: [existing behavior to preserve]

## Testable Assertions
1. `expect(processPayment(0)).toEqual({ amount: 0, status: 'completed' })`
2. `expect(processPayment(100)).toEqual({ amount: 100, status: 'completed' })`
3. `expect(() => processPayment(-1)).toThrow(InvalidAmountError)`
```

## Usage in Bugfix Workflow

1. Bug analysis identifies root cause at file:line
2. This skill formalizes the contract from the analysis
3. tdd-enforcer writes failing test from Bug Condition
4. tdd-enforcer writes preservation tests from Invariants
5. Minimal fix applied, contract audited
