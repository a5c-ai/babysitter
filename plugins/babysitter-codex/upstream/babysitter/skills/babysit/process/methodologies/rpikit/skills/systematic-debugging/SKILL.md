---
name: systematic-debugging
description: Structured debugging methodology using hypothesis-driven investigation, log analysis, and bisection to isolate and resolve defects.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Systematic Debugging

## Overview

Structured approach to investigating and resolving defects using hypothesis-driven methodology rather than trial-and-error.

## When to Use

- Step verification fails during implementation
- Unexpected behavior discovered during testing
- Bug reports require investigation
- Performance issues need root cause analysis

## Process

1. **Reproduce** - Confirm the defect with a minimal reproduction
2. **Hypothesize** - Form theories about the root cause
3. **Investigate** - Systematically test hypotheses (logs, breakpoints, bisection)
4. **Isolate** - Narrow to the specific component/line
5. **Fix** - Apply targeted fix addressing root cause
6. **Verify** - Confirm fix resolves the issue without regression

## Key Rules

- Never apply fixes without understanding the root cause
- Use web-researcher agent for unfamiliar error patterns
- Document the investigation path for future reference
- Verify that the fix does not introduce regressions

## Tool Use

Integrated into `methodologies/rpikit/rpikit-implement` (failure handling)
