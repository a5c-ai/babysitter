### Parallel Phase Design

When authoring a process definition, identify phases that have no mutual
dependencies and express them as parallel groups. This reduces total run time
without compromising correctness.

**Identifying independent phases:**

Two phases are independent — and safe to parallelize — when **all** of the
following hold:

1. They do not write to any resource that the other reads (no write-to-read
   dependency).
2. They do not both write to the same resource (no write-to-write conflict).
3. Each phase depends only on already-completed phases, not on each other.

**Example:** If phases 4, 5, and 6 all depend on the outputs of phases 1 and 2
but share no inputs or outputs with each other, they are candidates for
parallel execution.

**Expressing parallelism in the process definition:**

Use `ctx.parallel.all()` for a fixed set of independent tasks:

```js
const [featureTagging, hookImpl, retrospectIntegration] = await ctx.parallel.all([
  ctx.task(featureTaggingTask, { architecture, coreImpl }),
  ctx.task(hookImplementationTask, { architecture, coreImpl }),
  ctx.task(retrospectIntegrationTask, { architecture, coreImpl }),
]);
```

Use `ctx.parallel.map()` when applying the same task across multiple
independent items:

```js
const results = await ctx.parallel.map(modules, (mod) =>
  ctx.task(moduleImplementationTask, { module: mod, architecture }),
);
```

**When to use parallelism:**

- Multiple implementation phases that depend on the same planning/architecture
  output but not on each other.
- Per-module or per-component work where each unit is self-contained.
- Independent verification steps (e.g., linting, type-checking, and unit tests
  can often run in parallel).

**Safety constraints:**

- **Max 3 concurrent phases** by default. Keep parallel groups small to avoid
  overwhelming the execution environment.
- **Correctness over speed.** When dependency analysis is ambiguous or the
  phases might interact through shared files, fall back to sequential execution.
- **Merge before dependents.** Always `await` the full parallel group before
  dispatching any phase that consumes their outputs.
- **When in doubt, run sequentially.** A correct slow run is always preferable
  to a fast broken one.
