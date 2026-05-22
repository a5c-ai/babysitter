---
name: code-generation
description: Minimal, pattern-matching code output. Write the least code that satisfies requirements. Match existing project patterns. Use Write/Edit tools only.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
2. **Pattern-matching**: Follow existing project conventions (check patterns.md)
3. **Tool discipline**: Use Write/Edit for files, Bash only for runners and linters
4. **No gold plating**: Do not add features beyond what is required
5. **No premature optimization**: Optimize only when performance tests demand it

---

## Code Quality Checks

- Follow project naming conventions
- Match existing file structure and organization
- Use established error handling patterns
- Maintain consistent import ordering
- Follow TypeScript strictness (no `any`, proper narrowing)

## When to Use

- During TDD GREEN phase (minimal implementation)
- During TDD REFACTOR phase (pattern alignment)
- When implementing fixes in DEBUG workflow

## Agents Used

- `component-builder` (primary consumer)
- `bug-investigator` (fix implementation)
