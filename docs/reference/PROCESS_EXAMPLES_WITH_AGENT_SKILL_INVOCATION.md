# Process Examples with Agent/Skill Invocation

**Date:** 2026-01-20
**Task:** Create advanced process example demonstrating agent and skill invocation, quality convergence, TDD, parallelization, and breakpoints
**Status:** Historical note, updated for the current library layout

---

## Summary

The original January 2026 implementation report described a prototype where the advanced example lived inside a skill package. In the current repo, the public example process lives in the built-in library:

- Process implementation: `library/tdd-quality-convergence.js`
- Process documentation: `library/tdd-quality-convergence.md`
- Example inputs: `library/examples/tdd-quality-convergence-example.json`
- Babysitter skill instructions: `plugins/babysitter-unified/skills/babysit/SKILL.md`

The plugin skill does not ship a separate `process/` tree under `plugins/babysitter-unified/skills/babysit/`. The canonical process library is `library/`, and project-local `.a5c/processes/` copies are user-managed overrides or generated local assets.

---

## Current Example

The current advanced example is still the TDD quality convergence process. It demonstrates:

1. Agent-based planning
2. Test-Driven Development workflow
3. Quality convergence with iterative feedback
4. Parallel quality checks
5. Human review gates
6. Agent-based quality scoring
7. Final verification and review

See:

- `library/tdd-quality-convergence.js`
- `library/tdd-quality-convergence.md`
- `docs/user-guide/features/quality-convergence.md`
- `docs/reference/PROCESS_SELECTION.md`

---

## Correct Task Patterns

### Agent Tasks

Use `kind: "agent"` with a structured `agent.prompt` payload and optional `outputSchema`.

### Skill Tasks

Use `kind: "skill"` with parameters in `skill.context`. Do not rely on a separate `args` field. Instructional guidance belongs inside `skill.context.instructions`.

### Node Tasks

Use `kind: "node"` with a real process or task entry point. In the current packaging model, those entry points come from `library/` or from explicit project-local `.a5c/` copies.

---

## Current Usage

```bash
babysitter run:create \
  --process-id tdd-quality-convergence \
  --entry library/tdd-quality-convergence.js#process \
  --inputs library/examples/tdd-quality-convergence-example.json
```

If a project has copied or customized the process locally, the equivalent entry may instead be under `.a5c/processes/`. That is a project-local asset, not the built-in library source of truth.

---

## Packaging Clarification

The current model separates responsibilities:

- `library/` contains the built-in process library, examples, assets, methodologies, and specializations.
- `plugins/babysitter-unified/skills/babysit/SKILL.md` provides the Babysitter skill instructions used by harnesses.
- `.a5c/processes/`, `.a5c/skills/`, and `.a5c/agents/` are project-local copies or overrides when users install, generate, or customize assets locally.

For a broader explanation of that lookup and packaging model, see `docs/user-guide/features/process-library.md`.

---

## Historical Note

This document originally referenced prototype paths inside a skill package. Those paths were valid for an earlier packaging experiment but are not part of the current public repository layout. Public docs should use `library/` for built-in processes and describe `.a5c/` paths only as project-local copies.
