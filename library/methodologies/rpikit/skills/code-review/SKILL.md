---
name: code-review
description: Structured code quality assessment with Conventional Comments format, scaled review depth, and soft-gating verdicts preserving user autonomy.
allowed-tools: Read, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Code Review

## Overview

Assess code quality, design, correctness, and maintainability through a structured 9-step review workflow. Uses Conventional Comments format with file-specific references.

## When to Use

- After implementation phase completes
- When reviewing code changes before merge
- As part of the /review-code command

## Process

1. Identify modified files via git
2. Assess change magnitude for review depth
3. Execute 9-step review: context, correctness, design, testing, security flags, operations, maintainability
4. Synthesize findings in standardized report
5. Deliver verdict with rationale

## Review Depth Scaling

- Under 200 lines: full detail review
- 200-1000 lines: focused review on critical areas
- Over 1000 lines: architectural-level review only

## Verdicts

- **APPROVE**: Ready for security review
- **APPROVE WITH NITS**: Non-blocking suggestions only
- **REQUEST CHANGES**: Blocking issues exist (user may override)

## Key Rules

- Provide specific file paths and line numbers
- Include at least one positive comment per review
- Use Conventional Comments format with decorations
- Explain reasoning, not just observations
- Limit critical issues to top 5 per category
- Reviews are soft gates preserving user autonomy

## Tool Use

Invoke via babysitter process: `methodologies/rpikit/rpikit-review`
