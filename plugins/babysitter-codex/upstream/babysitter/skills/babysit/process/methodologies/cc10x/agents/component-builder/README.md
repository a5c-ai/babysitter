# Component Builder Agent

TDD-enforced feature development agent used in the BUILD workflow. Follows strict RED-GREEN-REFACTOR discipline with evidence-backed testing.

## TDD Cycle

1. **RED**: Write failing tests (exit code 1 required)
2. **GREEN**: Minimal implementation (exit code 0 required)
3. **REFACTOR**: Clean up while tests stay green

## Key Rules

- Always use run mode (`CI=true npm test`), never watch mode
- Write/Edit tools for file modifications, Bash only for runners
- Flag scope creep when >3 files change
- Report failure if tests fail 3 consecutive times

## Invocation

Used by process: `methodologies/cc10x/cc10x-build`
