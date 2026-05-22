---
name: test-driven-development
description: Test-first development practice where test specifications are written before production code, integrated into plan tasks as mandatory first sub-steps.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- During implementation (write tests before code)
- When verifying step completion

## Process

1. **Specify tests first** - Define inputs, expected outputs, edge cases
2. **Write test code** - Create automated tests matching specification
3. **Implement production code** - Write code that passes the tests
4. **Verify** - Run tests and confirm all pass

## Test Categories

- **Unit tests**: Isolated function/method testing
- **Integration tests**: Cross-component interaction testing
- **Manual verification**: Human-performed checks when automation is impractical

## Key Rules

- Never combine test writing and implementation into a single step
- Every task with code changes must have associated tests
- Tests must be runnable and produce clear pass/fail results
- Edge cases must be explicitly considered

## Tool Use

Integrated into `methodologies/rpikit/rpikit-plan` and `methodologies/rpikit/rpikit-implement`
