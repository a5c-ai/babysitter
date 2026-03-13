---
name: brainstorming
description: Clarify vague requirements through exploratory questioning and option generation before committing to research or implementation.
allowed-tools: Read, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Brainstorming

## Overview

When requirements are vague and "what to build" is unclear, brainstorming clarifies the problem space through structured questioning and option generation.

## When to Use

- Requirements lack clarity or specificity
- Multiple valid approaches exist and trade-offs need exploration
- The problem space needs definition before research
- Stakeholders have not converged on a direction

## Distinction from Research

- **Brainstorming**: Addresses "what to build" (unclear requirements)
- **Research**: Addresses "how it works" (clear goal, unknown implementation)

## Process

1. **Explore problem space** - Ask clarifying questions one at a time
2. **Identify ambiguities** - Surface assumptions and unknowns
3. **Generate options** - Propose design alternatives with trade-offs
4. **Select approach** - Human chooses direction
5. **Synthesize requirements** - Produce clear requirements for research phase

## Tool Use

Invoke via babysitter process: `methodologies/rpikit/rpikit-brainstorm`
