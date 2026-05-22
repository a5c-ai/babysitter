---
name: research-orchestration
description: Parallel research agent orchestration dispatching 5-10 concurrent agents for comprehensive multi-source research with synthesis and validation.
allowed-tools: Read, Bash, Grep, Glob
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
|-------|------------|----------|
| Shallow | 5 | Quick fact-finding, simple queries |
| Medium | 7 | Standard research, moderate complexity |
| Deep | 10 | Comprehensive analysis, complex queries |

---

## Process Flow

1. **Plan**: Decompose query into independent sub-queries
2. **Dispatch**: Run 5-10 research agents in parallel
3. **Synthesize**: Merge findings, identify consensus and conflicts
4. **Validate**: Cross-reference against codebase for accuracy

## Sources

- Codebase: source files, patterns, implementations
- Documentation: README, JSDoc, inline comments
- Configuration: package.json, tsconfig, CI/CD configs

## Confidence Scoring

Overall confidence is a weighted average of individual agent confidence scores, adjusted by validation results. Below 70% triggers human review.

## When to Use

- `/research [query]` slash command
- Before specification creation
- When investigating unfamiliar parts of the codebase

## Processes Used By

- `claudekit-research` (primary consumer)
