---
name: code-review-patterns
description: Multi-dimensional code assessment across security, quality, performance, and maintainability with confidence-gated reporting (>=80%) and Router Contract generation.
allowed-tools: Read, Bash, Grep, Glob
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Injection vulnerabilities (SQL, XSS, command)
- Authentication and authorization patterns
- Secrets handling (no hardcoded credentials)
- Input validation and sanitization

### Quality (weight: 25%)
- Naming conventions and consistency
- Code structure (SRP, cohesion, coupling)
- Error handling completeness
- Type safety (no `any` escapes)

### Performance (weight: 20%)
- Algorithmic complexity (flag O(n^2) or worse)
- Resource and memory leaks
- Database query efficiency (N+1)
- Caching opportunities

### Maintainability (weight: 25%)
- Documentation (JSDoc/TSDoc for public APIs)
- Test coverage adequacy
- Readability (function length, nesting depth)
- Tech debt markers (TODO, FIXME)

## Confidence Gating

- Only report issues with confidence >= 80%
- Empty catch blocks are always critical (100% confidence)
- Classify: critical, high, medium, low
- Include actionable remediation for each issue

## Router Contract

Every review must produce: STATUS, BLOCKING, REQUIRES_REMEDIATION, issue counts.

## When to Use

- Code review step in BUILD workflow
- Fix review in DEBUG workflow
- Full REVIEW workflow

## Agents Used

- `code-reviewer` (primary consumer)
- `silent-failure-hunter` (error handling dimension)
