---
name: planning-patterns
description: Structured planning methodology with research, brainstorming, phased plan creation, risk assessment, and plan-to-build continuity.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch
---

# Planning Patterns

## Overview

Structured methodology for comprehensive planning that flows directly into BUILD execution through plan-to-build continuity.

## Planning Process

### 1. Research Phase
- Search for existing solutions and patterns
- Identify relevant libraries and tools
- Find best practices in the domain
- Check for known pitfalls

### 2. Brainstorming Phase
- Generate at least 3 alternative approaches
- Evaluate trade-offs: complexity, time, risk, scalability
- Consider build-vs-buy decisions
- Rank by feasibility and alignment

### 3. Plan Creation
- Structure with phases, tasks, and milestones
- Define acceptance criteria per phase
- Map dependencies between tasks
- Include risk assessment with mitigations
- Define TDD strategy per coding phase
- Estimate effort and timeline

### 4. Review Gate
- Verify completeness against original request
- Validate logical phase ordering
- Check actionability of risk mitigations
- Score plan completeness (>=80 to pass)

## Plan-to-Build Continuity

- Save plans to `docs/plans/` directory
- Reference plan file in session memory
- BUILD workflow reads plan during requirements clarification
- Component-builder follows documented phases

## When to Use

- PLAN workflow (primary)
- Any task requiring strategic thinking before execution

## Agents Used

- `planner` (primary consumer)
- `github-researcher` (research phase)
