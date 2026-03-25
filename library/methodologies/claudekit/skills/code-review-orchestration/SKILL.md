---
name: code-review-orchestration
description: 6-agent parallel code review orchestration covering architecture, security, performance, testing, quality, and documentation dimensions with weighted scoring.
allowed-tools: Read, Bash, Grep, Glob
---

# Code Review Orchestration

## Overview

Orchestrates 6 specialized review agents running in parallel across independent dimensions. Each agent scores independently, and results are aggregated into a weighted final score with a clear recommendation.

## Six Dimensions

### Architecture (weight: 20%)
Module boundaries, dependency direction, design pattern adherence, architectural drift.

### Security (weight: 25%)
Injection vulnerabilities, auth, secrets, crypto, dependencies, headers.

### Performance (weight: 15%)
Algorithmic complexity, resource leaks, database patterns, caching, async.

### Testing (weight: 15%)
Coverage, quality, edge cases, isolation, flakiness, integration, error paths.

### Quality (weight: 15%)
Naming, readability, error handling, type safety, DRY, comments.

### Documentation (weight: 10%)
JSDoc, README updates, changelog, inline comments, type documentation.

## Scoring and Recommendation

- **APPROVE**: overall >= 80 AND zero critical issues
- **REQUEST_CHANGES**: overall >= 60 OR has critical issues
- **REJECT**: overall < 60

## When to Use

- `/code-review` slash command
- Post-implementation review in spec execution
- Pre-merge quality gate

## Agents Used

- `code-review-coordinator`, `security-analyst`, `performance-analyst`
- `testing-specialist`, `architecture-reviewer`

## Processes Used By

- `claudekit-code-review` (primary consumer)
- `claudekit-orchestrator` (via command dispatch)
