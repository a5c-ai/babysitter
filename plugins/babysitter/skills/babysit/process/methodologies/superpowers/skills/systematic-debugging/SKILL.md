---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes. Requires root cause investigation first.
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. ALWAYS find root cause before attempting fixes.

**Core principle:** No fixes without root cause investigation first.

## The Four Phases

1. **Root Cause Investigation** - Read errors, reproduce, check changes, gather evidence at component boundaries
2. **Pattern Analysis** - Find working examples, compare against references, identify differences
3. **Hypothesis and Testing** - Form single hypothesis, test minimally, one variable at a time
4. **Implementation** - Create failing test case, implement single fix, verify

## When 3+ Fixes Fail

Stop and question the architecture. Pattern of repeated failures indicates architectural problems, not implementation bugs.

## Red Flags (STOP and Follow Process)

- "Quick fix for now"
- "Just try changing X"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)

## Agents Used

- Process agents defined in `systematic-debugging.js`

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/systematic-debugging`
