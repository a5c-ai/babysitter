---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code. Enforces RED-GREEN-REFACTOR cycle.
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
2. **Verify RED** - Run test, confirm it fails for the right reason
3. **GREEN** - Write simplest code to pass (YAGNI)
4. **Verify GREEN** - Run test + full suite, all must pass
5. **REFACTOR** - Clean up while keeping tests green
6. **COMMIT** - Frequent small commits

---

## Red Flags (STOP and Start Over)

- Code before test
- Test passes immediately
- "I'll test after"
- "Too simple to test"
- Rationalizing "just this once"

## Agents Used

- Process agents defined in `test-driven-development.js`

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/test-driven-development`
