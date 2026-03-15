---
name: brainstorming
description: Use when starting any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.
---

# Brainstorming Ideas Into Designs

## Overview

Collaborative design refinement through Socratic dialogue. Explore project context, ask clarifying questions one at a time, propose 2-3 approaches, present design in sections for incremental approval, then transition to planning.

**Core principle:** No implementation until design is approved. Every project goes through this.

## When to Use

- Before ANY creative or implementation work
- New features, components, modifications
- Even "simple" projects (unexamined assumptions cause wasted work)

## Process

1. **Explore project context** - files, docs, recent commits
2. **Ask clarifying questions** - one at a time, prefer multiple choice
3. **Propose 2-3 approaches** - with tradeoffs and recommendation
4. **Present design in sections** - get approval after each section
5. **Write design doc** - save to `docs/plans/YYYY-MM-DD-<topic>-design.md`
6. **Transition to writing-plans** - the ONLY next step

## HARD GATE

Do NOT invoke any implementation, write any code, or take action until design is approved.

## Key Principles

- One question at a time
- YAGNI ruthlessly
- Incremental validation
- Scale sections to complexity

## Agents Used

- `agents/code-reviewer/` - For design document review
- Process agents defined in `brainstorming.js`

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/brainstorming`
