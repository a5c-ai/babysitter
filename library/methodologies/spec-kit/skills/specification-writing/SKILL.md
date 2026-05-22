---
name: specification-writing
description: Write feature specifications as requirements and user stories with acceptance criteria, focusing on business value and testable conditions.
allowed-tools: Read, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Formalizing vague feature requests into structured requirements
- Clarifying scope boundaries for a feature area
- Establishing acceptance criteria for user stories

## Key Principle

Specifications describe desired behavior from the user's perspective. They define **what** the system should do, not **how** it should be built. Business value must be explicit in every requirement.

## Process

1. **Elicit requirements** - Extract functional and non-functional requirements from feature description
2. **Write user stories** - Author stories in standard format with personas
3. **Define acceptance criteria** - Testable conditions for each story (Given/When/Then)
4. **Identify edge cases** - Error scenarios and boundary conditions
5. **Clarify gaps** - Surface and resolve ambiguities and contradictions
6. **Document assumptions** - Make implicit assumptions explicit
7. **Define scope** - Clearly delineate in-scope vs. out-of-scope
8. **Human review** - Approve specification before planning

## Tool Use

Invoke via babysitter process: `methodologies/spec-kit/spec-kit-specification`
Full pipeline: `methodologies/spec-kit/spec-kit-orchestrator`
