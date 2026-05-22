---
name: tdd-enforcement
description: Red-Green-Refactor TDD methodology with mandatory failing tests, minimal implementation, quality refactoring, and 80% coverage gating.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Write tests that define expected behavior
- Tests MUST fail (exit code 1)
- Use CI=true or --run flag, never watch mode
- Apply timeout guards (60s) to prevent hanging
- Record exit code as evidence

### 2. GREEN Phase - Minimal Implementation
- Write the minimal code to make tests pass
- Do NOT add features not covered by tests
- Do NOT optimize prematurely
- Tests MUST pass (exit code 0)
- Record exit code as evidence

### 3. REFACTOR Phase - Quality Improvement
- Apply SOLID principles and clean code patterns
- Improve naming, reduce coupling
- Remove duplication
- Run tests after EACH refactoring step
- Tests MUST remain passing (exit code 0)

### 4. Coverage Gate
- Measure coverage: statements, branches, functions, lines
- Minimum 80% overall coverage required
- Iterate: write additional tests for gaps until threshold met
- Maximum 3 convergence iterations

## Rules

- Never skip the RED phase
- Never accept GREEN without exit code 0
- Never use watch mode in CI
- Always record evidence (exit codes, coverage numbers)
- Enforce 80% coverage threshold

## When to Use

- All code implementation tasks
- Feature development
- Bug fixes (write regression test first)

## Agents Used

- `tdd-guide` (primary consumer)
- `code-reviewer` (validates test quality)
