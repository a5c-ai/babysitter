---
name: code-review-pipeline
description: Multi-dimensional code review across correctness, security, performance, and maintainability with confidence-gated reporting and remediation loops.
allowed-tools: Read, Bash, Grep, Glob
---

# Code Review Pipeline

## Overview

Multi-dimensional code review methodology adapted from the Everything Claude Code project. Reviews across 4 dimensions with confidence-gated issue reporting and automated remediation loops.

## Review Dimensions

### Dimension 1: Correctness
- Logic errors and off-by-one mistakes
- Edge case handling (null, undefined, empty, boundary)
- Type safety (no implicit any, proper narrowing)
- Error handling completeness
- Floating promise detection
- Race condition analysis

### Dimension 2: Security
- Injection vectors (SQL, XSS, command, template)
- Authentication and authorization gaps
- Data exposure (PII, credentials, internal state)
- Dependency vulnerabilities (known CVEs)
- Input validation completeness

### Dimension 3: Performance
- Algorithmic complexity (O(n^2) detection)
- Memory leaks (event listeners, closures, caches)
- Unnecessary allocations in hot paths
- Database query optimization (N+1, missing indexes)
- Bundle size impact

### Dimension 4: Maintainability
- Naming clarity and consistency
- Documentation completeness (JSDoc, inline comments)
- Test coverage adequacy
- Coupling analysis (afferent/efferent)
- File organization compliance

## Confidence Gating
- Score each issue 0-100 on confidence
- Only report issues >= 80% confidence
- Prevents false positive noise
- Higher confidence for clear patterns, lower for heuristic matches

## Remediation Loop
- Prioritize: critical > high > medium > low
- Apply fixes via refactor-cleaner agent
- Re-review after remediation
- Maximum 2 remediation cycles
- Exit when no critical/high issues remain

## When to Use

- Post-implementation review
- Pre-merge PR review
- Security audit
- Technical debt assessment

## Agents Used

- `code-reviewer` (primary)
- `refactor-cleaner` (remediation)
