# Standard Process Library Implementation

**Date:** 2026-01-20
**Task:** Todo #6 - Create the standard library of processes
**Status:** Historical implementation note, updated for the current library layout

---

## Summary

This document originally described an early standard-library foundation in a project-local `.a5c/processes/` layout. The current built-in standard library for this repository lives under `library/`.

Project-local `.a5c/processes/` directories still matter, but only as copied or customized workspace assets. Public documentation should treat `library/` as the canonical source of built-in processes.

---

## Current Library Layout

The current library is organized under `library/`, including:

- `library/methodologies/`
- `library/specializations/`
- `library/processes/shared/`
- `library/examples/`
- `library/assets/`
- `library/reference/`
- `library/README.md`

Representative entry points that exist in the repo today:

- `library/tdd-quality-convergence.js`
- `library/methodologies/plan-and-execute.js`
- `library/methodologies/ralph.js`
- `library/methodologies/devin.js`

For current user-facing counts and category breakdowns, see `docs/user-guide/features/process-library.md`.

---

## Relationship to `.a5c/processes/`

Use the following distinction in public docs:

- `library/` is the built-in library shipped with the Babysitter repository and the active process-library binding.
- `.a5c/processes/` is a project-local location for copied, generated, or customized process assets.

That means a process may exist in both places:

1. As the built-in source in `library/`
2. As a project-local override in `.a5c/processes/`

When docs show a built-in example, they should point at `library/` unless the point of the example is specifically about local overrides.

---

## Current Usage Examples

### Built-in Process

```bash
babysitter run:create \
  --process-id methodologies/plan-and-execute \
  --entry library/methodologies/plan-and-execute.js#process
```

### Built-in Methodology Loop

```bash
babysitter run:create \
  --process-id methodologies/ralph \
  --entry library/methodologies/ralph.js#process
```

### Built-in Advanced Example

```bash
babysitter run:create \
  --process-id tdd-quality-convergence \
  --entry library/tdd-quality-convergence.js#process \
  --inputs library/examples/tdd-quality-convergence-example.json
```

### Project-Local Override

If a team copies one of those processes into `.a5c/processes/`, it can run the local copy explicitly by changing the `--entry` path to the project-local file.

---

## Related Current Docs

Use these docs for the current public explanation of the process library:

- `docs/user-guide/features/process-library.md`
- `docs/user-guide/features/process-definitions.md`
- `docs/user-guide/01-discovery-analysis.md`
- `docs/reference/PROCESS_SELECTION.md`

---

## Historical Note

The January 2026 report captured an intermediate implementation stage. The process-library packaging and discovery model has since converged on the built-in `library/` layout plus project-local `.a5c/` copies. References to `.a5c/processes/` in older implementation notes should therefore be interpreted as local override examples, not as the repository’s canonical built-in library path.
