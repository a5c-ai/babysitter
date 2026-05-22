---
name: architecture-patterns
description: System and API design guidance covering component boundaries, data flow, integration patterns, and scalability considerations.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Single responsibility boundaries
- Interface contracts and type safety
- Dependency injection patterns
- Module cohesion and coupling analysis

### Data Flow
- Request/response patterns
- Event-driven architecture
- State management strategies
- Data transformation pipelines

### Integration Patterns
- API design (REST, GraphQL, RPC)
- Message queuing and async processing
- Service boundaries and communication
- Error propagation across boundaries

### Scalability
- Horizontal vs vertical scaling considerations
- Caching strategies
- Database design and query optimization
- Load balancing and distribution

## Decision Checkpoints

Architectural decisions require user approval when:
- Introducing new service boundaries
- Changing data flow patterns
- Adding new external dependencies
- Modifying public API contracts

## When to Use

- During PLAN workflow architecture phases
- During BUILD when architectural choices arise
- When reviewing system design in REVIEW workflow

## Agents Used

- `planner` (architecture planning)
- `component-builder` (architecture implementation)
- `code-reviewer` (architecture review)
