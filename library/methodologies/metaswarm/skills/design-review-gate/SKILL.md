---
name: design-review-gate
description: Parallel design review by 6 specialist agents (PM, Architect, Designer, Security Design, UX, CTO) with mandatory unanimous approval.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Design Review Gate

## Overview

Run 6 specialist design reviews in parallel. ALL SIX must approve before implementation begins. Maximum 3 iterations before human escalation.

## When to Use

- After brainstorming and planning, before implementation
- When validating a new feature design
- When introducing new architectural patterns

## Process

1. Run 6 reviews in parallel: PM, Architect, Designer, Security Design, UX, CTO
2. All 6 must approve (unanimous)
3. If any reject, consolidate findings and iterate
4. Max 3 iterations before escalating to human

## Reviewers

| Agent | Focus |
|-------|-------|
| Product Manager | Use cases, user benefits, scope alignment |
| Architect | Architectural fit, patterns, technical debt |
| Designer | UX/API design, developer experience |
| Security Design | Threat modeling, OWASP Top 10 |
| UX Reviewer | Usability, accessibility, user flows |
| CTO | TDD readiness, codebase alignment, risk |

## Tool Use

Invoke via babysitter process: `methodologies/metaswarm/metaswarm-design-review`
