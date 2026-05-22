---
name: smart-routing
description: Complexity-based task routing with Q-Learning optimization, Agent Booster WASM fast-path, and Mixture-of-Experts model selection.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

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
