---
name: plan-implementation
description: Disciplined execution of approved plans with step-by-step verification, phase checkpoints, failure investigation, and mandatory code/security reviews.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Plan Implementation

## Overview

Execute approved plans with discipline. Each step follows a read-modify-verify loop. Phase checkpoints require human approval. Failures trigger investigation before proceeding.

## When to Use

- After a plan has been approved via the planning phase
- For medium and high stakes changes (low stakes can proceed inline)
- When structured execution with verification is needed

## Process

1. **Load plan** - Validate plan exists and is approved
2. **Stakes enforcement** - High: halt without plan. Medium: ask. Low: proceed.
3. **Worktree isolation** - Offer git worktree based on stakes level
4. **Execute steps** - For each: mark in-progress, locate files, read, modify, verify, mark complete
5. **Phase checkpoints** - Summarize and ask: continue, review, or pause
6. **Failure handling** - Stop immediately, investigate, propose fix, get approval for deviations
7. **Code review** - Run code-reviewer agent (APPROVE / APPROVE_WITH_NITS / REQUEST_CHANGES)
8. **Security review** - Run security-reviewer agent (halt if failed)
9. **Completion summary** - Steps completed, files changed, test status, plan location

## Key Rules

- Follow the plan strictly; deviations require explicit approval
- Verify before declaring done; run verification after each step
- Track progress visibly via plan document updates
- Read files before modifying them
- Complete code and security reviews before finishing

## Tool Use

Invoke via babysitter process: `methodologies/rpikit/rpikit-implement`
