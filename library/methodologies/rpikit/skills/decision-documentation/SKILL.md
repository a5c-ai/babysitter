---
name: decision-documentation
description: Create Architecture Decision Records (ADRs) documenting significant technical choices with context, options, consequences, and sequential numbering.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Choosing between competing approaches
- Documenting a decision for future reference
- Recording rationale that would otherwise be lost

## ADR Format

- **Title**: Clear description of the decision
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: Why this decision is needed
- **Options**: Alternatives considered with pros/cons
- **Decision**: The chosen option with rationale
- **Consequences**: Expected positive and negative outcomes

## Output

ADRs are written to `docs/decisions/` with sequential numbering (e.g., `0001-use-typescript.md`).

## Tool Use

Invoke via babysitter process: `methodologies/rpikit/rpikit-decision`
