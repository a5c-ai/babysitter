---
name: smart-routing
description: Complexity-based task routing with Q-Learning optimization, Agent Booster WASM fast-path, and Mixture-of-Experts model selection.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Smart Routing

## Overview

Intelligent task routing using Q-Learning to select optimal execution paths. Simple tasks route to Agent Booster (WASM, <1ms, $0), medium tasks to efficient models, and complex tasks to Opus + multi-agent swarms.

## When to Use

- Optimizing cost vs. quality tradeoffs for diverse task types
- When tasks range from simple transforms to complex multi-file changes
- Reducing latency for common code transformations
- Learning from routing history to improve future decisions

## Routing Tiers

| Tier | Target | Latency | Cost |
|------|--------|---------|------|
| Agent Booster | Simple transforms (var-to-const, add-types) | <1ms | $0 |
| Medium | Standard coding tasks | ~500ms | Low |
| Complex | Multi-agent swarm coordination | 2-5s | Higher |

## Agent Booster Transforms

- `var-to-const` - Variable declaration modernization
- `add-types` - TypeScript type annotation insertion
- `add-error-handling` - Try/catch wrapper insertion
- `async-await` - Promise chain to async/await conversion
- `extract-function` - Code block extraction to named functions
- `add-jsdoc` - Documentation generation

## Agents Used

- `agents/optimizer/` - Performance and cost optimization
- `agents/architect/` - Complex task decomposition

## Tool Use

Invoke via babysitter process: `methodologies/ruflo/ruflo-task-routing`
