---
name: finishing-work
description: Final completion discipline including summary generation, plan document updates, and confirmation that all success criteria from the original plan are satisfied.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Finishing Work

## Overview

Final completion protocol ensuring implementation is properly wrapped up with summary, plan updates, and success criteria confirmation.

## When to Use

- After all implementation steps and reviews are complete
- When transitioning from implementation to done
- Final quality check before closing out work

## Process

1. Verify all plan steps marked complete
2. Confirm all success criteria met
3. Update plan document with final status
4. Generate completion summary (steps, phases, files, tests, reviews)
5. Confirm with user that work is complete

## Summary Format

- Steps completed: N/M
- Phases completed: N/M
- Files changed: [list]
- Test status: passing/failing
- Code review: verdict
- Security review: passed/failed
- Plan document: path
- All success criteria met: yes/no

## Tool Use

Integrated into `methodologies/rpikit/rpikit-implement` (completion summary)
