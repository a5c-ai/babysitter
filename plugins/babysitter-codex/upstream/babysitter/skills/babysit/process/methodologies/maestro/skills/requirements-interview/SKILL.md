---
name: requirements-interview
description: Interactive PM interview with expertise-adaptive questioning for requirements elicitation
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---
# Requirements Interview

## Capabilities

Conducts interactive requirements interviews adapted to the user's expertise level. Generates structured requirements specifications from conversation. Identifies user personas, feature lists, constraints, and acceptance criteria.

## Tool Use Instructions

- Use **Read** to examine existing spec files or project context
- Use **Grep/Glob** to find existing requirements or documentation
- Use **Write** to generate the requirements specification document
- Use **Bash** to check project structure for context

## Process Integration

- Used in `maestro-orchestrator.js` Phase 1 (PM Interview)
- Maps to tasks: `maestro-pm-interview`
- Agent: Product Manager (PM)
- Adapts interview depth: beginner (guided), intermediate (balanced), expert (concise)
- Outputs feed into `specification-generation` skill
