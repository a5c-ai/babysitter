---
name: research-first-dev
description: Research-first development methodology that investigates existing solutions, brainstorms alternatives, and evaluates trade-offs before any implementation begins.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch
---

# Research-First Development

## Overview

Research-first development methodology adapted from the Everything Claude Code project. Mandates investigation of existing solutions and alternatives before writing any code.

## Research Process

### 1. Problem Analysis
- Parse the request into specific technical requirements
- Identify the domain and relevant technology stack
- List known constraints (time, resources, compatibility)
- Define success criteria

### 2. Existing Solution Search
- Search GitHub for similar implementations
- Check package registries (npm, PyPI, crates.io, etc.)
- Review documentation for framework-specific solutions
- Identify relevant design patterns
- Check for known anti-patterns to avoid

### 3. Alternative Brainstorming
- Generate at least 3 alternative approaches
- Include a "build" option and at least one "buy/reuse" option
- Consider unconventional approaches

### 4. Trade-Off Evaluation
- Complexity: implementation effort, learning curve
- Time: development timeline, time-to-value
- Risk: failure modes, dependency risks, maintenance burden
- Scalability: growth limits, performance under load
- Score each alternative on all 4 axes

### 5. Recommendation
- Rank alternatives by composite score
- Provide clear recommendation with justification
- Include risk mitigation plan for chosen approach
- Define go/no-go criteria

## Iterative Retrieval
- Start broad, narrow based on findings
- Use confidence scoring to decide when to stop
- Maximum 3 retrieval rounds per topic
- Cache findings for reuse in subsequent phases

## When to Use

- New feature development (always)
- Architecture changes
- Technology selection
- Dependency evaluation
- Performance optimization strategy

## Agents Used

- `planner` (primary consumer)
- `architect` (architecture-specific research)
