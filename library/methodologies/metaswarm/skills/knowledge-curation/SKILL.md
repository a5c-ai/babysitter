---
name: knowledge-curation
description: Context priming before work (bd prime) and self-reflection after completion to extract patterns, gotchas, and decisions into the knowledge base.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Knowledge Curation

## Overview

Two-phase knowledge management: prime context before work starts, and extract learnings after work completes. Knowledge persists in JSONL files for cross-session continuity.

## When to Use

- Before starting any work (prime mode)
- After completing work, BEFORE PR creation (reflect mode)
- When recovering from context loss (recovery priming)

## Knowledge Categories

| Category | File | Content |
|----------|------|---------|
| Critical Rules | facts.jsonl | MUST FOLLOW constraints |
| Gotchas | gotchas.jsonl | Common pitfalls |
| Patterns | patterns.jsonl | Codebase best practices |
| Decisions | decisions.jsonl | Architectural choices with rationale |
| Anti-Patterns | anti-patterns.jsonl | What NOT to do |
| Codebase Facts | codebase-facts.jsonl | Structural information |
| API Behaviors | api-behaviors.jsonl | Undocumented quirks |

## Process

### Prime Mode
1. Load knowledge base files for work type
2. Surface MUST FOLLOW rules first
3. Present GOTCHAS and PATTERNS
4. Load relevant DECISIONS

### Reflect Mode
1. Extract patterns from completed work
2. Identify gotchas from review failures
3. Record architectural decisions with rationale
4. Persist to .beads/knowledge/

## Tool Use

Invoke via babysitter process: `methodologies/metaswarm/metaswarm-knowledge-cycle`
