---
name: design-review-gate
description: Parallel design review by 6 specialist agents (PM, Architect, Designer, Security Design, UX, CTO) with mandatory unanimous approval.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When validating a new feature design
- When introducing new architectural patterns

## Process

1. Run 6 reviews in parallel: PM, Architect, Designer, Security Design, UX, CTO
2. All 6 must approve (unanimous)
3. If any reject, consolidate findings and iterate
4. Max 3 iterations before escalating to human

## Reviewers

| Agent | Focus |
|-------|-------|
| Product Manager | Use cases, user benefits, scope alignment |
| Architect | Architectural fit, patterns, technical debt |
| Designer | UX/API design, developer experience |
| Security Design | Threat modeling, OWASP Top 10 |
| UX Reviewer | Usability, accessibility, user flows |
| CTO | TDD readiness, codebase alignment, risk |

## Tool Use

Invoke via babysitter process: `methodologies/metaswarm/metaswarm-design-review`
