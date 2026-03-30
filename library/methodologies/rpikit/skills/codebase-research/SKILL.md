---
name: codebase-research
description: Systematic codebase exploration following the Iron Law - understand the problem before exploring code. Four phases with file-finder and web-researcher agents.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Codebase Research

## Overview

Perform systematic codebase exploration to understand how existing systems work. Follows the Iron Law: "Do NOT explore the codebase until the problem is understood."

## When to Use

- Implementation direction is clear but codebase understanding is needed
- Investigating how an existing feature works before modifying it
- Understanding dependencies and data flows before planning
- Gathering context for a known goal

## Process

1. **Understand the request** - Ask clarifying questions one at a time (purpose, specifics, scope, constraints, context). Do NOT read any files until confirmed.
2. **Explore the codebase** - Use file-finder agent, read in order, trace data flows, identify constraints.
3. **Document findings** - Write structured research document to `docs/plans/YYYY-MM-DD-<topic>-research.md`.
4. **Transition** - Ask: plan, continue research, or conclude.

## Key Rules

- Quotations from source material capped at 125 characters maximum
- Only proceed to exploration after human confirms understanding
- Use file-finder agent for initial file discovery
- Use web-researcher agent for external context needs

## Agents Used

- `agents/file-finder/` - Locates relevant files with suggested reading order
- `agents/web-researcher/` - Gathers external context when needed

## Tool Use

Invoke via babysitter process: `methodologies/rpikit/rpikit-research`
