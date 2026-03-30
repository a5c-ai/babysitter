---
name: plan-writing
description: Transform research findings into actionable implementation plans with stakes-based rigor, test-first strategy, and granular task decomposition.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Plan Writing

## Overview

Convert research findings into actionable implementation plans. Scales planning rigor to stakes level. Every code-changing task specifies tests before implementation.

## When to Use

- After research phase identifies what needs to change
- Before implementing any medium or high stakes changes
- When requirements are clear and codebase is understood

## Process

1. **Load research** - Find `*-<topic>-research.md` in `docs/plans/`
2. **Classify stakes** - Low (isolated, reversible), Medium (multiple files), High (architectural)
3. **Define success criteria** - Functional, non-functional, and acceptance criteria
4. **Decompose tasks** - Granular steps with file paths, line references, verification methods
5. **Plan tests** - Test specification as first sub-step per task (test-first)
6. **Assess risks** - Breaking changes, performance, security, dependencies, rollback strategy
7. **Write plan document** - `docs/plans/YYYY-MM-DD-<topic>-plan.md`
8. **Approval gate** - Human approves, requests changes, or returns to research

## Anti-Patterns to Avoid

- Vague task descriptions without specific file references
- Missing verification criteria for any step
- Combining test writing and implementation into single steps
- Planning rigor mismatched to stakes level
- Proceeding without explicit user approval

## Tool Use

Invoke via babysitter process: `methodologies/rpikit/rpikit-plan`
