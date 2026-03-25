---
name: debugging-patterns
description: Root cause analysis frameworks including log-first investigation, git bisect correlation, and pattern-based diagnosis with confidence scoring.
allowed-tools: Read, Bash, Grep, Glob, WebSearch
---

# Debugging Patterns

## Overview

Provides structured frameworks for root cause analysis. The log-first methodology ensures evidence is gathered before hypotheses are formed.

## Log-First Investigation

1. Read ALL available logs, error output, and stack traces
2. DO NOT form hypotheses before reading evidence
3. Identify the exact error: message, file, line, call stack
4. Determine reproduction steps from evidence
5. Check git log for recent changes correlating with bug introduction

## Pattern-Based Diagnosis

- Check patterns.md for known gotchas matching the error
- Cross-reference with common patterns: null pointer, race condition, resource leak, config error
- Rate root cause confidence (>=80% to proceed with fix)

## Evidence Collection

- Stack traces with full call chain
- Error messages with context
- Exit codes from reproduction attempts
- Git blame/log for change correlation
- Environment differences (if applicable)

## When to Use

- During DEBUG workflow investigation phase
- When BUILD tests fail unexpectedly
- When reviewing error handling gaps

## Agents Used

- `bug-investigator` (primary consumer)
- `silent-failure-hunter` (pattern reference)
