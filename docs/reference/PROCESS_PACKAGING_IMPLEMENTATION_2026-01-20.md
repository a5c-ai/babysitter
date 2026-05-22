# Process Packaging Implementation

**Date:** 2026-01-20
**Task:** Todo #7 - Allow packaging processes with skills
**Status:** Historical implementation note, updated for the current packaging model

---

## Summary

This report originally documented a prototype that colocated example processes inside a skill package. The current public layout uses a different packaging model:

- The built-in process library lives under `library/`.
- The Babysitter plugin source provides skill instructions and plugin behavior under `plugins/babysitter-unified/`.
- Project-local `.a5c/` directories contain copied or customized assets for a specific workspace.

The canonical built-in source is no longer a plugin-internal `process/` directory.

---

## Current Packaging Model

### 1. Built-in Library

The shipped process library is in `library/`. That is where public docs should point when they reference built-in processes, examples, methodologies, specializations, or shared assets.

Real examples in this repo include:

- `library/tdd-quality-convergence.js`
- `library/tdd-quality-convergence.md`
- `library/examples/tdd-quality-convergence-example.json`
- `library/methodologies/plan-and-execute.js`
- `library/methodologies/ralph.js`
- `library/methodologies/devin.js`

### 2. Plugin Package

The plugin source lives under `plugins/babysitter-unified/`. It provides:

- `plugins/babysitter-unified/skills/babysit/SKILL.md`
- plugin metadata and installation behavior
- references and hook-related assets

The plugin does not currently ship the full process tree inside `plugins/babysitter-unified/skills/babysit/`.

### 3. Project-Local Assets

Project-local copies live under `.a5c/`, for example:

- `.a5c/processes/`
- `.a5c/skills/`
- `.a5c/agents/`

Those are local copies, generated assets, or overrides. They are useful for customization, but they are not the repository’s built-in library location.

### 4. Active Library Binding

Babysitter resolves the active library through the process-library binding managed by the SDK and CLI.

```bash
babysitter process-library:active --json
```

That command reports the currently bound library root and revision.

---

## Current Discovery and Execution

### Discovery

```bash
find library -name "*.js" -type f
```

Use `.a5c/processes/` only when you intentionally want project-local copies or overrides.

### Execution

```bash
babysitter run:create \
  --process-id tdd-quality-convergence \
  --entry library/tdd-quality-convergence.js#process \
  --inputs library/examples/tdd-quality-convergence-example.json
```

### Integration

```javascript
import { process as tddQualityConvergence } from './library/tdd-quality-convergence.js';

export async function deploymentProcess(inputs, ctx) {
  return await tddQualityConvergence(inputs, ctx);
}
```

If a team copies a built-in process into `.a5c/processes/`, they can update the entry path to the local copy explicitly.

---

## Migration from the Prototype

The January 2026 prototype assumed a skill could expose its own process tree as the public source of truth. The current guidance is:

1. Point public documentation at `library/` for built-in processes.
2. Treat `plugins/babysitter-unified/skills/babysit/SKILL.md` as the skill entry point, not the process library root.
3. Describe `.a5c/` paths only as project-local copies or overrides.
4. Use `babysitter process-library:active --json` when you need to confirm the active bound library.

---

## Public References

For the current user-facing explanation of this model, see:

- `docs/user-guide/features/process-library.md`
- `docs/user-guide/features/process-definitions.md`
- `docs/plugins.md`
- `docs/reference/PROCESS_SELECTION.md`

---

## Historical Note

This file preserves the intent of the original implementation report while replacing prototype-only paths with the current public model. References to skill-internal process directories from the January prototype should now be read as historical context rather than current repository structure.
