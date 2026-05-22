# Diagnostic-first phase

A reusable `defineTask` snippet for the recurring-bug anti-pattern, where each
new fix attempt is informed by a hypothesis instead of by live data.

## When to use it

Use it as **Phase A** of any run whose prompt fits the shape
*"we shipped a fix and the bug recurred."* Don't use it for greenfield work
or first-attempt bug fixes — it's specifically tuned for the failure mode
where the unit-test feedback loop has become actively misleading because the
mock can't reproduce the production behaviour (response caps, rate limits,
RLS, framework caches, etc.).

## Anti-pattern this targets

A real example: a project's test suite used an in-memory Postgres
(pglite) for data-layer tests. The first three attempts at fixing a stuck
"Annotate all (N)" badge each chose a plausible hypothesis (sentinel rows,
client-side cache refresh, set-based completeness check), shipped a fix that
passed every test gate, and never moved the user-visible count. The
fourth attempt led with a phase like this one — querying the live
production DB via the service-role key — and the very first artifact
identified the actual cause: PostgREST's default 1000-row response cap was
silently truncating `.in('recipe_id', ...)` queries. The mock DB couldn't
reproduce it because the cap is a server-side framework default, not a
schema constraint.

## Contract

- Instantiates a service-role Supabase client from the project's env file.
- Runs **only** the queries supplied via `args.queries` (the prompt rejects
  the script if any query contains a mutation keyword).
- Writes three artifacts:
  - `<outputDir>/diagnose.mjs` — the one-shot Node script (auditable).
  - `<outputDir>/diagnose.json` — structured query results.
  - `<outputDir>/diagnose-summary.md` — counts, evidence, hypothesis,
    one-paragraph fix recommendation for the Phase B implementer.
- **Read-only by construction.** Forbids `UPDATE`/`DELETE`/`INSERT`/
  `UPSERT`/mutating `RPC` in both the generated script and the model's
  output.
- **Source-tree-safe.** Does not modify `src/`, `tests/`, `supabase/`,
  `scripts/`, or framework-config files.

## Usage

```js
import { diagnosticFirstPhaseTask } from
  'specializations/qa-testing-automation/diagnostic-first-phase';

export async function process(inputs, ctx) {
  const diagnostic = await ctx.task(diagnosticFirstPhaseTask, {
    envFile: '.env.production.local',
    outputDir: `.a5c/runs/${ctx.runId}/artifacts`,
    queries: [
      {
        name: 'incompleteRecipes',
        description: 'Recipes the badge marks pending',
        code: "client.from('recipe').select('id,title').is('deleted_at', null)",
      },
    ],
    hypotheses: [
      'PostgREST 1000-row response cap silently truncating .in() on the join table',
      'Stale framework Server Component cache after the mutation',
    ],
  });

  // diagnostic.topHypothesis + diagnostic.recommendation feed the Phase B impl.
  // ...
}
```

## Why upstream

The "fix-and-recur" pattern is universal across web/data projects. Mock-DB
unit tests systematically can't reproduce production response caps, rate
limits, or framework caches. Naming the diagnostic-first phase as a
first-class library primitive makes "start with the data" the default for
this class of bug instead of the exception.

## Adjacent reading

- The `@productionContract` JSDoc convention (sibling contribution) — name
  the user-visible assertion the run must satisfy in the process file's
  header, so completion is gated on user-visible state, not just on test
  pass-rate.

## Provenance

Discovered in the wild during a real-world Next.js + Supabase project. The
canonical example run is on file at the contributing project under the
process id `cookbook-annotate-pending-evidence-may-13`; this contribution
is the generalized version of that run's `diagnoseProductionTask`.
