---
name: verification-before-completion
description: Evidence requirement enforcement ensuring all claims are backed by logs, test results, or exit codes. Zero = success, non-zero = failure. No guessing allowed.
allowed-tools: Read, Bash, Grep, Glob
---

# Verification Before Completion

## Overview

Enforces the evidence-first principle: every claim of success, fix, or completion must be backed by concrete evidence. Exit codes, test output, and logs are the only acceptable proof.

## Evidence Types

1. **Exit codes**: zero = success, non-zero = failure
2. **Test output**: pass/fail counts, coverage percentages
3. **Logs**: error messages, stack traces, resolution confirmation
4. **Build output**: compilation success/failure with timestamps

## Rules

- Never claim "should work" without evidence
- Never claim success without exit code 0
- Never claim a bug is fixed without reproduction failure
- Always capture and report exit codes
- Always run the full test suite, not just targeted tests
- Use timeout guards (`timeout 60s`) to prevent hanging

## When to Use

- Before completing any BUILD workflow step
- Before claiming a DEBUG fix is verified
- Before approving a REVIEW result
- Before marking any task as done

## Agents Used

- `integration-verifier` (primary consumer)
- `component-builder` (TDD evidence)
- `bug-investigator` (fix evidence)
