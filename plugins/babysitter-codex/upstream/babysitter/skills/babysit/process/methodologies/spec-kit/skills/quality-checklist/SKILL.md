---
name: quality-checklist
description: Validate implementation quality through custom checklists, scoring against constitution standards, specification coverage, and producing remediation recommendations.
allowed-tools: Read, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Quality Checklist

## Overview

Post-implementation quality gate that validates the completed work against constitution standards, specification requirements, and custom quality checks. Produces a scored assessment with remediation recommendations for any failures.

## When to Use

- After implementation is complete, before declaring done
- When validating code quality against constitution standards
- When verifying specification requirement coverage
- When running custom project-specific quality checks

## Key Principle

Quality validation must be objective, reproducible, and multi-dimensional. Failed items must have actionable remediation recommendations. The checklist supports convergence loops -- re-validate after fixes until quality threshold is met.

## Process

1. **Validate code quality** - Check against constitution coding standards
2. **Verify test coverage** - Ensure coverage meets constitution thresholds
3. **Check spec satisfaction** - Verify all requirements are implemented
4. **Assess performance** - Validate against constitution benchmarks
5. **Verify security** - Check compliance with constitution security constraints
6. **Execute custom checks** - Run any project-specific quality checks
7. **Score overall quality** - Weighted average across categories (0-100)
8. **Produce recommendations** - Actionable fixes for failed items
9. **Remediation loop** - Re-validate after fixes (up to 3 iterations)

## Tool Use

Invoke via babysitter process: `methodologies/spec-kit/spec-kit-implementation` (quality checklist phase)
Full pipeline: `methodologies/spec-kit/spec-kit-orchestrator`
