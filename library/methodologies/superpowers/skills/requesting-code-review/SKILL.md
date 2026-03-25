---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements.
---

# Requesting Code Review

## Overview

Dispatch code-reviewer agent to catch issues before they cascade.

**Core principle:** Review early, review often.

## When to Request

- After each task in subagent-driven development
- After completing major features
- Before merge to main

## Process

1. Get git SHAs (base and head)
2. Dispatch code-reviewer agent with context
3. Act on feedback (Critical: fix immediately, Important: fix before proceeding, Minor: note for later)

## Agents Used

- `agents/code-reviewer/` - Senior code review agent

## Tool Use

Referenced by `subagent-driven-development` and `executing-plans` processes.
